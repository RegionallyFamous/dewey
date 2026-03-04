<?php
/**
 * Dewey Knowledge Base
 *
 * Loads the bundled WordPress documentation knowledge base and finds entries
 * relevant to the user's question. Matched excerpts are injected into the AI
 * system prompt so Dewey can answer detailed WordPress questions accurately.
 *
 * @package Dewey
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Provides a searchable, in-memory WordPress knowledge base.
 */
final class Dewey_Knowledge {

	/**
	 * Cached knowledge base topics (loaded once per request).
	 *
	 * @var array<int,array<string,mixed>>|null
	 */
	private static ?array $cache = null;

	/**
	 * Maximum topics to inject into the AI prompt per query.
	 */
	private const MAX_TOPICS = 2;

	/**
	 * Minimum relevance score required for a topic to be injected.
	 * A score of 2.0 requires at least one title match (2.0 pts) or
	 * two keyword matches (1.5 pts each).
	 */
	private const MIN_SCORE = 2.0;

	/**
	 * Find the most relevant knowledge-base topics for a given question.
	 *
	 * Returns up to MAX_TOPICS entries, each an associative array with keys:
	 * `id`, `title`, `category`, `keywords`, `excerpt`.
	 *
	 * @param string $question The user's question or query.
	 * @return array<int,array<string,mixed>> Matched topic entries.
	 */
	public static function find_relevant( string $question ): array {
		$tokens = self::tokenize( $question );

		if ( empty( $tokens ) ) {
			return array();
		}

		$scored = array();

		foreach ( self::load() as $item ) {
			$score = self::score( $tokens, $item );
			if ( $score >= self::MIN_SCORE ) {
				$scored[] = array(
					'item'  => $item,
					'score' => $score,
				);
			}
		}

		if ( empty( $scored ) ) {
			return array();
		}

		usort( $scored, fn( $a, $b ) => $b['score'] <=> $a['score'] );

		return array_column( array_slice( $scored, 0, self::MAX_TOPICS ), 'item' );
	}

	/**
	 * Score a single knowledge-base topic against a set of question tokens.
	 *
	 * Scoring weights:
	 * - 2.0 pts  per token that appears in the topic title
	 * - 1.5 pts  per token that exactly matches a keyword
	 * - 0.5 pts  per token found inside a keyword (partial match)
	 *
	 * @param string[]             $tokens Normalised question tokens.
	 * @param array<string,mixed>  $item   Knowledge-base topic entry.
	 * @return float Relevance score (higher = more relevant).
	 */
	private static function score( array $tokens, array $item ): float {
		$score      = 0.0;
		$title      = strtolower( $item['title'] ?? '' );
		$keywords   = array_map( 'strtolower', $item['keywords'] ?? array() );

		foreach ( $tokens as $token ) {
			// Title match — strong signal.
			if ( str_contains( $title, $token ) ) {
				$score += 2.0;
			}

			// Keyword exact match.
			if ( in_array( $token, $keywords, true ) ) {
				$score += 1.5;
				continue;
			}

			// Keyword partial match (token appears inside a keyword phrase).
			foreach ( $keywords as $kw ) {
				if ( strlen( $token ) >= 4 && str_contains( $kw, $token ) ) {
					$score += 0.5;
					break;
				}
			}
		}

		return $score;
	}

	/**
	 * Tokenize a question string into lowercase words.
	 *
	 * Strips punctuation, splits on whitespace, filters short/stop words.
	 *
	 * @param string $text Input text.
	 * @return string[] Array of meaningful lowercase tokens.
	 */
	private static function tokenize( string $text ): array {
		// Lowercase and strip non-word characters (keep underscores, hyphens).
		$text   = strtolower( $text );
		$text   = preg_replace( '/[^a-z0-9_ \-]/', ' ', $text ) ?? $text;
		$words  = preg_split( '/\s+/', trim( $text ) ) ?: array();

		// Stop words that carry no signal for topic matching.
		static $stop_words = array(
			'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and',
			'or', 'but', 'is', 'it', 'be', 'do', 'my', 'me', 'we', 'us',
			'can', 'how', 'what', 'when', 'where', 'why', 'who', 'which',
			'this', 'that', 'with', 'from', 'by', 'was', 'are', 'has', 'have',
			'will', 'not', 'i', 'you', 'he', 'she', 'they', 'get', 'use',
		);

		return array_values(
			array_filter(
				$words,
				fn( $w ) => strlen( $w ) >= 3 && ! in_array( $w, $stop_words, true )
			)
		);
	}

	/**
	 * Load and cache the knowledge-base topics from the JSON file.
	 *
	 * @return array<int,array<string,mixed>> All knowledge-base topics.
	 */
	private static function load(): array {
		if ( null !== self::$cache ) {
			return self::$cache;
		}

		$path = dirname( __FILE__ ) . '/knowledge-base.json';

		if ( ! file_exists( $path ) ) {
			self::$cache = array();
			return self::$cache;
		}

		$json = file_get_contents( $path );

		if ( false === $json ) {
			self::$cache = array();
			return self::$cache;
		}

		$data = json_decode( $json, true );

		if ( ! is_array( $data ) || empty( $data['topics'] ) ) {
			self::$cache = array();
			return self::$cache;
		}

		self::$cache = (array) $data['topics'];

		return self::$cache;
	}
}
