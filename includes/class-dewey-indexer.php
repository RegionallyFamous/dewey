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
	const REBUILD_BATCH_SIZE = 300;

	/**
	 * Number of words to store per post. Storing 600 words gives the AI
	 * much richer context than the old 20–130 word excerpts while keeping
	 * the option payload manageable.
	 */
	const CONTENT_WORDS = 600;

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

		$settings   = Dewey_Settings::get_all();
		$post_types = is_array( $settings['indexed_post_types'] ?? null )
			? $settings['indexed_post_types']
			: array( 'post', 'page' );
		$statuses   = is_array( $settings['indexed_statuses'] ?? null )
			? $settings['indexed_statuses']
			: array( 'publish' );

		$items = array();
		$page = 1;
		while ( true ) {
			$query = new WP_Query(
				array(
					'post_type'              => $post_types,
					'post_status'            => $statuses,
					'posts_per_page'         => self::REBUILD_BATCH_SIZE,
					'paged'                  => $page,
					'no_found_rows'          => true,
					'ignore_sticky_posts'    => true,
					'update_post_meta_cache' => false,
					'update_post_term_cache' => false,
					'orderby'                => 'date',
					'order'                  => 'DESC',
					'fields'                 => 'ids',
				)
			);
			$post_ids = is_array( $query->posts ) ? $query->posts : array();
			if ( empty( $post_ids ) ) {
				break;
			}

			foreach ( $post_ids as $post_id ) {
				$post = get_post( $post_id );
				if ( ! $post || ! $post instanceof WP_Post ) {
					continue;
				}

				// Prefer full content over excerpt so we have richer text to
				// score and send to the AI as context.
				$full_text = wp_strip_all_tags( (string) $post->post_content );
				if ( '' === trim( $full_text ) ) {
					$full_text = (string) $post->post_excerpt;
				}

				$snippet    = wp_trim_words( $full_text, self::CONTENT_WORDS, '…' );
				$word_count = str_word_count( $snippet );

				$items[] = array(
					'post_id'    => (int) $post->ID,
					'title'      => get_the_title( $post ),
					'permalink'  => get_permalink( $post ),
					'snippet'    => $snippet,
					'word_count' => $word_count,
					'modified'   => get_post_modified_time( 'c', true, $post ),
				);
			}

			if ( count( $post_ids ) < self::REBUILD_BATCH_SIZE ) {
				break;
			}
			$page++;
		}

		// Compute average document length for BM25 length normalisation.
		$avg_doc_length = 0;
		if ( ! empty( $items ) ) {
			$total_words    = array_sum( array_column( $items, 'word_count' ) );
			$avg_doc_length = (int) round( $total_words / count( $items ) );
		}

		$payload = array(
			'version'        => 2,
			'generated_at'   => gmdate( 'c' ),
			'avg_doc_length' => max( 1, $avg_doc_length ),
			'items'          => $items,
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
	 * Search the index using a BM25-style scorer.
	 *
	 * Scoring formula per term per document:
	 *   title_tf   = substr_count occurrences in title
	 *   body_tf    = substr_count occurrences in snippet
	 *   title_score = 3 × log(1 + title_tf)        (title matches weighted 3×)
	 *   body_score  = log(1 + body_tf)
	 *   length_norm = 0.75 + 0.25 × (doc_words / avg_doc_length)
	 *   term_score  = (title_score + body_score) / length_norm
	 *
	 * The final document score is the sum of term_scores across all query terms.
	 *
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

		$avg_doc_length = max( 1, (int) ( $index['avg_doc_length'] ?? 300 ) );
		$scored         = array();

		foreach ( $items as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}

			$title_lower   = strtolower( (string) ( $item['title'] ?? '' ) );
			$snippet_lower = strtolower( (string) ( $item['snippet'] ?? '' ) );
			$doc_words     = max( 1, (int) ( $item['word_count'] ?? str_word_count( $snippet_lower ) ) );
			$length_norm   = 0.75 + 0.25 * ( $doc_words / $avg_doc_length );

			$doc_score = 0.0;
			foreach ( $terms as $term ) {
				$title_tf  = substr_count( $title_lower, $term );
				$body_tf   = substr_count( $snippet_lower, $term );

				if ( 0 === $title_tf && 0 === $body_tf ) {
					continue;
				}

				$title_score = 3.0 * log( 1.0 + $title_tf );
				$body_score  = log( 1.0 + $body_tf );
				$doc_score  += ( $title_score + $body_score ) / $length_norm;
			}

			if ( $doc_score > 0.0 ) {
				$item['score'] = $doc_score;
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
