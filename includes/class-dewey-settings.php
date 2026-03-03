<?php
declare(strict_types=1);
/**
 * Dewey_Settings
 *
 * Centralized settings schema, defaults, and sanitization.
 *
 * @package Dewey
 */

defined( 'ABSPATH' ) || exit;

final class Dewey_Settings {

	const OPTION_KEY = 'dewey_settings';

	/**
	 * Cached sanitized settings to avoid repeated option reads.
	 *
	 * @var array<string,mixed>|null
	 */
	private static ?array $cache = null;

	/**
	 * Default settings.
	 *
	 * @var array<string,mixed>
	 */
	private const DEFAULTS = array(
		'retrieval_mode'      => 'core', // core|indexed|auto
		'cost_mode'           => 'minimize', // minimize|balanced
		'indexed_post_types'  => array( 'post', 'page' ),
		'indexed_statuses'    => array( 'publish' ),
		'assistant_tone'      => 'match', // match|casual|precise
		'assistant_verbosity' => 'concise', // concise|detailed
		'citation_style'      => 'titles', // titles|links
		'search_max_results'  => 5,
		'search_max_content'  => 1800,
		'response_max_tokens' => 350,
	);

	/**
	 * Allowlist values for enum-like string settings.
	 *
	 * @var array<string,array<int,string>>
	 */
	private const STRING_ALLOWLISTS = array(
		'retrieval_mode'      => array( 'core', 'indexed', 'auto' ),
		'cost_mode'           => array( 'minimize', 'balanced' ),
		'assistant_tone'      => array( 'match', 'casual', 'precise' ),
		'assistant_verbosity' => array( 'concise', 'detailed' ),
		'citation_style'      => array( 'titles', 'links' ),
	);

	/**
	 * Get all settings with defaults applied.
	 *
	 * @return array<string,mixed>
	 */
	public static function get_all(): array {
		if ( null !== self::$cache ) {
			return self::$cache;
		}

		$saved = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $saved ) ) {
			$saved = array();
		}

		$normalized = wp_parse_args(
			self::sanitize_all( $saved ),
			self::DEFAULTS
		);

		self::$cache = $normalized;
		return $normalized;
	}

	/**
	 * Get one setting.
	 *
	 * @param string $key
	 * @return mixed
	 */
	public static function get( string $key ): mixed {
		$all = self::get_all();
		return $all[ $key ] ?? null;
	}

	/**
	 * Persist a partial settings update.
	 *
	 * @param array $updates
	 * @return array Updated full settings.
	 */
	public static function update( array $updates ): array {
		$current  = self::get_all();
		$sanitized = self::sanitize_all( $updates );
		$merged   = array_merge( $current, $sanitized );

		update_option( self::OPTION_KEY, $merged );
		self::$cache = $merged;
		return $merged;
	}

	/**
	 * Default settings.
	 *
	 * @return array
	 */
	public static function defaults(): array {
		return self::DEFAULTS;
	}

	/**
	 * Sanitize settings payload against allowlist schema.
	 *
	 * @param array $settings
	 * @return array
	 */
	public static function sanitize_all( array $settings ): array {
		$clean = array();

		foreach ( self::STRING_ALLOWLISTS as $key => $allowed ) {
			if ( ! array_key_exists( $key, $settings ) ) {
				continue;
			}
			$clean[ $key ] = self::sanitize_allowlisted_string(
				$settings[ $key ],
				$allowed,
				(string) self::DEFAULTS[ $key ]
			);
		}

		if ( array_key_exists( 'indexed_post_types', $settings ) ) {
			$clean['indexed_post_types'] = self::sanitize_post_types( $settings['indexed_post_types'] );
		}

		if ( array_key_exists( 'indexed_statuses', $settings ) ) {
			$clean['indexed_statuses'] = self::sanitize_statuses( $settings['indexed_statuses'] );
		}

		if ( array_key_exists( 'search_max_results', $settings ) ) {
			$clean['search_max_results'] = min( 20, max( 1, absint( $settings['search_max_results'] ) ) );
		}

		if ( array_key_exists( 'search_max_content', $settings ) ) {
			$clean['search_max_content'] = min( 8000, max( 500, absint( $settings['search_max_content'] ) ) );
		}

		if ( array_key_exists( 'response_max_tokens', $settings ) ) {
			$clean['response_max_tokens'] = min( 1200, max( 150, absint( $settings['response_max_tokens'] ) ) );
		}

		return $clean;
	}

	/**
	 * @return bool
	 */
	public static function is_cost_minimized(): bool {
		return 'minimize' === (string) self::get( 'cost_mode' );
	}

	/**
	 * @return int
	 */
	public static function search_max_results(): int {
		$value = (int) self::get( 'search_max_results' );
		if ( $value <= 0 ) {
			$value = (int) self::DEFAULTS['search_max_results'];
		}

		if ( self::is_cost_minimized() ) {
			$value = min( $value, 5 );
		}

		return max( 1, $value );
	}

	/**
	 * @return int
	 */
	public static function search_max_content(): int {
		$value = (int) self::get( 'search_max_content' );
		if ( $value <= 0 ) {
			$value = (int) self::DEFAULTS['search_max_content'];
		}

		if ( self::is_cost_minimized() ) {
			$value = min( $value, 1800 );
		}

		return max( 500, $value );
	}

	/**
	 * @return int
	 */
	public static function response_max_tokens(): int {
		$value = (int) self::get( 'response_max_tokens' );
		if ( $value <= 0 ) {
			$value = (int) self::DEFAULTS['response_max_tokens'];
		}

		if ( self::is_cost_minimized() ) {
			$value = min( $value, 350 );
		}

		return max( 150, $value );
	}

	/**
	 * @param mixed $post_types
	 * @return array
	 */
	private static function sanitize_post_types( $post_types ): array {
		$list = is_array( $post_types ) ? $post_types : array( $post_types );
		$list = array_filter( array_map( 'sanitize_key', $list ) );

		$allowed = get_post_types( array( 'public' => true ), 'names' );
		$clean   = array_values( array_intersect( $list, $allowed ) );

		return empty( $clean ) ? self::DEFAULTS['indexed_post_types'] : $clean;
	}

	/**
	 * @param mixed $statuses
	 * @return array
	 */
	private static function sanitize_statuses( $statuses ): array {
		$list = is_array( $statuses ) ? $statuses : array( $statuses );
		$list = array_filter( array_map( 'sanitize_key', $list ) );

		$allowed = get_post_stati( array( 'public' => true ), 'names' );
		if ( empty( $allowed ) ) {
			$allowed = array( 'publish' );
		}

		$clean = array_values( array_intersect( $list, $allowed ) );
		return empty( $clean ) ? self::DEFAULTS['indexed_statuses'] : $clean;
	}

	/**
	 * Sanitize string settings against a strict allowlist.
	 *
	 * @param mixed             $value Raw value.
	 * @param array<int,string> $allowed Allowed values.
	 * @param string            $fallback Fallback value.
	 * @return string
	 */
	private static function sanitize_allowlisted_string(
		mixed $value,
		array $allowed,
		string $fallback
	): string {
		$normalized = sanitize_key( (string) $value );
		return in_array( $normalized, $allowed, true ) ? $normalized : $fallback;
	}
}
