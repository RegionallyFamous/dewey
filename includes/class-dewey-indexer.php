<?php
declare(strict_types=1);
/**
 * Dewey_Indexer
 *
 * Option-backed indexing scaffold for Dewey retrieval.
 *
 * @package Dewey
 */

defined( 'ABSPATH' ) || exit;

final class Dewey_Indexer {
	const INDEX_OPTION_KEY  = 'dewey_index_data';
	const STATUS_OPTION_KEY = 'dewey_index_status';

	/**
	 * Build or rebuild the option-backed index.
	 *
	 * @return array<string,mixed>
	 */
	public static function rebuild(): array {
		$started_at = gmdate( 'c' );
		self::update_status(
			array(
				'state'          => 'running',
				'started_at'     => $started_at,
				'last_error'     => '',
				'indexed_count'  => 0,
				'last_completed' => '',
			)
		);

		$settings  = Dewey_Settings::get_all();
		$post_types = is_array( $settings['indexed_post_types'] ?? null )
			? $settings['indexed_post_types']
			: array( 'post', 'page' );
		$statuses  = is_array( $settings['indexed_statuses'] ?? null )
			? $settings['indexed_statuses']
			: array( 'publish' );
		$max_len   = Dewey_Settings::search_max_content();

		$query = new WP_Query(
			array(
				'post_type'              => $post_types,
				'post_status'            => $statuses,
				'posts_per_page'         => 300,
				'no_found_rows'          => true,
				'ignore_sticky_posts'    => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
				'orderby'                => 'date',
				'order'                  => 'DESC',
				'fields'                 => 'ids',
			)
		);

		$items = array();
		foreach ( $query->posts as $post_id ) {
			$post = get_post( $post_id );
			if ( ! $post || ! $post instanceof WP_Post ) {
				continue;
			}

			$text = (string) $post->post_excerpt;
			if ( '' === trim( $text ) ) {
				$text = wp_strip_all_tags( (string) $post->post_content );
			}

			$items[] = array(
				'post_id'   => (int) $post->ID,
				'title'     => get_the_title( $post ),
				'permalink' => get_permalink( $post ),
				'snippet'   => wp_trim_words( $text, max( 20, (int) floor( $max_len / 15 ) ), '…' ),
				'modified'  => get_post_modified_time( 'c', true, $post ),
			);
		}

		$payload = array(
			'version'      => 1,
			'generated_at' => gmdate( 'c' ),
			'items'        => $items,
		);

		update_option( self::INDEX_OPTION_KEY, $payload );
		self::update_status(
			array(
				'state'          => 'idle',
				'started_at'     => $started_at,
				'last_error'     => '',
				'indexed_count'  => count( $items ),
				'last_completed' => gmdate( 'c' ),
			)
		);

		return self::status();
	}

	/**
	 * @return array<string,mixed>
	 */
	public static function status(): array {
		$status = get_option( self::STATUS_OPTION_KEY, array() );
		if ( ! is_array( $status ) ) {
			$status = array();
		}

		$index = get_option( self::INDEX_OPTION_KEY, array() );
		$count = 0;
		if ( is_array( $index ) && is_array( $index['items'] ?? null ) ) {
			$count = count( $index['items'] );
		}

		return wp_parse_args(
			$status,
			array(
				'state'          => 'idle',
				'started_at'     => '',
				'last_error'     => '',
				'indexed_count'  => $count,
				'last_completed' => '',
			)
		);
	}

	/**
	 * @return bool
	 */
	public static function has_index(): bool {
		$index = get_option( self::INDEX_OPTION_KEY, array() );
		return is_array( $index ) && ! empty( $index['items'] ) && is_array( $index['items'] );
	}

	/**
	 * @param string $question
	 * @return array<int,array<string,mixed>>
	 */
	public static function search_index( string $question ): array {
		$index = get_option( self::INDEX_OPTION_KEY, array() );
		$items = is_array( $index ) && is_array( $index['items'] ?? null )
			? $index['items']
			: array();
		if ( empty( $items ) ) {
			return array();
		}

		$terms = self::tokenize( $question );
		if ( empty( $terms ) ) {
			return array_slice( $items, 0, Dewey_Settings::search_max_results() );
		}

		$scored = array();
		foreach ( $items as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$haystack = strtolower(
				(string) ( $item['title'] ?? '' ) .
				' ' .
				(string) ( $item['snippet'] ?? '' )
			);
			$score = 0;
			foreach ( $terms as $term ) {
				if ( false !== strpos( $haystack, $term ) ) {
					$score++;
				}
			}
			if ( $score > 0 ) {
				$item['score'] = $score;
				$scored[]      = $item;
			}
		}

		usort(
			$scored,
			static function ( array $a, array $b ): int {
				return ( $b['score'] ?? 0 ) <=> ( $a['score'] ?? 0 );
			}
		);

		return array_slice( $scored, 0, Dewey_Settings::search_max_results() );
	}

	/**
	 * @param array<string,mixed> $updates
	 * @return void
	 */
	private static function update_status( array $updates ): void {
		$current = self::status();
		update_option( self::STATUS_OPTION_KEY, array_merge( $current, $updates ) );
	}

	/**
	 * @param string $value
	 * @return array<int,string>
	 */
	private static function tokenize( string $value ): array {
		$parts = preg_split( '/[^a-z0-9]+/i', strtolower( $value ) );
		if ( ! is_array( $parts ) ) {
			return array();
		}

		$parts = array_filter(
			$parts,
			static function ( string $token ): bool {
				return strlen( $token ) >= 3;
			}
		);

		return array_values( array_unique( $parts ) );
	}
}
