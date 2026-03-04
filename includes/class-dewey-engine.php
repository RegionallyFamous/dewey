<?php
declare(strict_types=1);
/**
 * Dewey_Engine
 *
 * Retrieval and answer generation pipeline.
 *
 * @package Dewey
 */

defined( 'ABSPATH' ) || exit;

final class Dewey_Engine {
	/**
	 * @param string                              $question
	 * @param string                              $assistant_system_prompt
	 * @param array<int,array{role:string,text:string}> $history
	 * @param string                              $page_context  wp-admin screen slug (e.g. "edit", "post", "dashboard").
	 * @param int                                 $post_id       ID of the post currently open in the editor (0 = none).
	 * @return array<string,mixed>|WP_Error
	 */
	public static function answer_question( string $question, string $assistant_system_prompt = '', array $history = array(), string $page_context = '', int $post_id = 0 ) {
		$question = trim( wp_strip_all_tags( $question ) );
		if ( '' === $question ) {
			return new WP_Error( 'dewey_invalid_question', 'Question cannot be empty.', array( 'status' => 400 ) );
		}

		$intent_router = new Dewey_Intent_Router();
		$intent        = $intent_router->route( $question );
		if ( 'settings' === ( $intent['type'] ?? '' ) && ! empty( $intent['requires_confirm'] ) ) {
			$token = Dewey_REST_Controller::create_confirm_token(
				(string) ( $intent['action'] ?? '' ),
				is_array( $intent['params'] ?? null ) ? $intent['params'] : array()
			);

			return array(
				'requires_confirm' => true,
				'token'            => $token,
				'message'          => sprintf(
					/* translators: %s: action description */
					__( 'Please confirm this change before I proceed: %s.', 'dewey' ),
					(string) ( $intent['user_facing_action'] ?? __( 'Apply settings change', 'dewey' ) )
				),
			);
		}

		if ( 'settings' === ( $intent['type'] ?? '' ) && ! empty( $intent['action'] ) ) {
			return self::apply_non_confirm_settings_intent( $intent );
		}

		$retrieval = self::retrieve_context( $question );
		if ( is_wp_error( $retrieval ) ) {
			return $retrieval;
		}

		$answer_result = self::generate_answer( $question, $retrieval['context_blocks'], $assistant_system_prompt, $history, $page_context, $post_id );
		if ( is_wp_error( $answer_result ) ) {
			return $answer_result;
		}

		return array(
			'answer'     => $answer_result['answer'],
			'follow_ups' => $answer_result['follow_ups'] ?? array(),
			'citations'  => $retrieval['citations'],
			'meta'       => array(
				'retrieval_mode' => $retrieval['retrieval_mode'],
				'result_count'   => count( $retrieval['citations'] ),
				'provider'       => $answer_result['provider'],
				'model'          => $answer_result['model'],
			),
		);
	}

	/**
	 * @return array<string,mixed>|WP_Error
	 */
	private static function retrieve_context( string $question ) {
		$settings       = Dewey_Settings::get_all();
		$mode           = (string) ( $settings['retrieval_mode'] ?? 'core' );
		$effective_mode = self::resolve_retrieval_mode( $mode );

		// Expand the question into multiple search terms so we catch semantic
		// variations ("keeping readers coming back" → retention, engagement, …).
		$search_terms = self::expand_query_for_search( $question );

		// Run searches for each term and merge, deduplicating by post_id.
		// Aggregate scores so a post that appears in multiple term results
		// ranks higher than one that only matches a single term.
		$merged    = array();
		$max_total = Dewey_Settings::search_max_results();

		foreach ( $search_terms as $term ) {
			$term_results = 'indexed' === $effective_mode
				? Dewey_Indexer::search_index( $term )
				: self::search_core( $term );

			if ( ! is_array( $term_results ) ) {
				continue;
			}

			foreach ( $term_results as $result ) {
				$post_id = (int) ( $result['post_id'] ?? 0 );
				if ( $post_id <= 0 ) {
					continue;
				}
				if ( isset( $merged[ $post_id ] ) ) {
					$merged[ $post_id ]['score'] = ( $merged[ $post_id ]['score'] ?? 0 ) + ( $result['score'] ?? 1 );
				} else {
					$result['score'] = $result['score'] ?? 1;
					$merged[ $post_id ] = $result;
				}
			}
		}

		uasort(
			$merged,
			static function ( array $a, array $b ): int {
				return ( $b['score'] ?? 0 ) <=> ( $a['score'] ?? 0 );
			}
		);

		$raw_results = array_values( array_slice( $merged, 0, $max_total ) );

		if ( ! is_array( $raw_results ) ) {
			return new WP_Error( 'dewey_retrieval_failed', __( 'Archive retrieval failed.', 'dewey' ), array( 'status' => 500 ) );
		}

		$max_content = Dewey_Settings::search_max_content();
		$citations   = array();
		$contexts    = array();
		foreach ( $raw_results as $result ) {
			$post_id   = (int) ( $result['post_id'] ?? 0 );
			$title     = (string) ( $result['title'] ?? '' );
			$permalink = (string) ( $result['permalink'] ?? '' );
			$snippet   = (string) ( $result['snippet'] ?? '' );
			if ( $post_id <= 0 || '' === $title || '' === $snippet ) {
				continue;
			}

			$snippet = self::safe_substr( $snippet, $max_content );
			$citations[] = array(
				'post_id'   => $post_id,
				'title'     => $title,
				'permalink' => $permalink,
				'snippet'   => $snippet,
			);
			$contexts[] = sprintf( '[%d] %s (%s): %s', $post_id, $title, $permalink, $snippet );
		}

		return array(
			'retrieval_mode' => $effective_mode,
			'citations'      => $citations,
			'context_blocks' => $contexts,
		);
	}

	/**
	 * Use a fast, cheap AI call to extract 3–5 search keywords from the user's
	 * question. Returns an array of keyword strings including the original
	 * question as the first element. Falls back gracefully on any failure.
	 *
	 * @param string $question
	 * @return array<int,string>
	 */
	private static function expand_query_for_search( string $question ): array {
		$fallback = array( $question );

		if ( ! function_exists( 'wp_ai_client_prompt' ) ) {
			return $fallback;
		}

		try {
			$expand_prompt =
				"Extract 3 to 5 short search keywords from the following question. " .
				"Return only the keywords, comma-separated on a single line, nothing else.\n" .
				'Question: ' . $question;

			$prompt = wp_ai_client_prompt( $expand_prompt );
			if ( method_exists( $prompt, 'using_temperature' ) ) {
				$prompt = $prompt->using_temperature( 0 );
			}
			if ( method_exists( $prompt, 'using_max_tokens' ) ) {
				$prompt = $prompt->using_max_tokens( 60 );
			}

			$raw = $prompt->generate_text();
			if ( is_wp_error( $raw ) || ! is_string( $raw ) || '' === trim( $raw ) ) {
				return $fallback;
			}

			$keywords = array_filter(
				array_map( 'trim', explode( ',', $raw ) ),
				static function ( string $k ): bool {
					return strlen( $k ) >= 2 && strlen( $k ) <= 60;
				}
			);

			if ( empty( $keywords ) ) {
				return $fallback;
			}

			// Always include the original question so it can anchor the merged results.
			return array_values( array_unique( array_merge( array( $question ), $keywords ) ) );
		} catch ( Throwable $e ) {
			return $fallback;
		}
	}

	/**
	 * @return array<int,array<string,mixed>>
	 */
	private static function search_core( string $question ): array {
		$settings   = Dewey_Settings::get_all();
		$post_types = is_array( $settings['indexed_post_types'] ?? null )
			? $settings['indexed_post_types']
			: array( 'post', 'page' );
		$statuses   = is_array( $settings['indexed_statuses'] ?? null )
			? $settings['indexed_statuses']
			: array( 'publish' );

		$query = new WP_Query(
			array(
				's'                      => $question,
				'post_type'              => $post_types,
				'post_status'            => $statuses,
				'posts_per_page'         => Dewey_Settings::search_max_results(),
				'no_found_rows'          => true,
				'ignore_sticky_posts'    => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);

		$results = array();
		foreach ( $query->posts as $post ) {
			if ( ! $post instanceof WP_Post ) {
				continue;
			}

			$text = (string) $post->post_excerpt;
			if ( '' === trim( $text ) ) {
				$text = wp_strip_all_tags( (string) $post->post_content );
			}

			$results[] = array(
				'post_id'   => (int) $post->ID,
				'title'     => get_the_title( $post ),
				'permalink' => get_permalink( $post ),
				'snippet'   => wp_trim_words( $text, 80, '…' ),
			);
		}

		return $results;
	}

	/**
	 * Build a short site-stats summary string to orient the AI without a search.
	 *
	 * @return string  e.g. "Published posts: 47. Last published: 2026-02-28. Top categories: WordPress (12), Plugins (8)."
	 */
	private static function get_site_stats_context(): string {
		$parts = array();

		// Total published posts.
		$counts = wp_count_posts( 'post' );
		$total  = isset( $counts->publish ) ? (int) $counts->publish : 0;
		if ( $total > 0 ) {
			$parts[] = sprintf(
				/* translators: %d: number of published posts */
				_n( 'Published posts: %d', 'Published posts: %d', $total, 'dewey' ),
				$total
			);
		}

		// Most-recent published date.
		$latest = get_posts(
			array(
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'numberposts'    => 1,
				'orderby'        => 'date',
				'order'          => 'DESC',
				'fields'         => 'ids',
			)
		);
		if ( ! empty( $latest ) ) {
			$date    = get_the_date( 'Y-m-d', (int) $latest[0] );
			$parts[] = 'Last published: ' . (string) $date;
		}

		// Top 5 categories by post count.
		$categories = get_terms(
			array(
				'taxonomy'   => 'category',
				'orderby'    => 'count',
				'order'      => 'DESC',
				'number'     => 5,
				'hide_empty' => true,
			)
		);
		if ( ! is_wp_error( $categories ) && ! empty( $categories ) ) {
			$cat_labels = array();
			foreach ( $categories as $cat ) {
				if ( $cat instanceof WP_Term ) {
					$cat_labels[] = $cat->name . ' (' . $cat->count . ')';
				}
			}
			if ( ! empty( $cat_labels ) ) {
				$parts[] = 'Top categories: ' . implode( ', ', $cat_labels );
			}
		}

		return empty( $parts ) ? '' : implode( '. ', $parts ) . '.';
	}

	/**
	 * Build a one-liner context string for the post currently open in the editor.
	 * Returns empty string when the post cannot be resolved or has no useful data.
	 *
	 * @param int $post_id
	 * @return string  e.g. "Currently editing: 'How to Use Categories' (status: draft, tags: tutorials, SEO)."
	 */
	private static function get_current_post_context( int $post_id ): string {
		if ( $post_id <= 0 ) {
			return '';
		}

		$post = get_post( $post_id );
		if ( ! $post instanceof WP_Post ) {
			return '';
		}

		// Only expose posts the current user can actually edit.
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return '';
		}

		$title  = get_the_title( $post );
		$status = (string) $post->post_status;
		$parts  = array();

		if ( '' !== $title ) {
			$parts[] = "'$title'";
		}

		$parts[] = 'status: ' . $status;

		// Tags.
		$tags = get_the_terms( $post_id, 'post_tag' );
		if ( ! is_wp_error( $tags ) && ! empty( $tags ) ) {
			$tag_names = array_map( static fn( WP_Term $t ): string => $t->name, $tags );
			$parts[]   = 'tags: ' . implode( ', ', array_slice( $tag_names, 0, 5 ) );
		}

		// Categories.
		$cats = get_the_terms( $post_id, 'category' );
		if ( ! is_wp_error( $cats ) && ! empty( $cats ) ) {
			$cat_names = array_map( static fn( WP_Term $t ): string => $t->name, $cats );
			$parts[]   = 'categories: ' . implode( ', ', array_slice( $cat_names, 0, 5 ) );
		}

		return 'Currently editing: ' . implode( ', ', $parts ) . '.';
	}

	/**
	 * @param array<int,string>                         $context_blocks
	 * @param string                                    $assistant_system_prompt
	 * @param array<int,array{role:string,text:string}> $history
	 * @param string                                    $page_context  wp-admin screen slug.
	 * @param int                                       $post_id       Post currently open in the editor.
	 * @return array<string,mixed>|WP_Error
	 */
	private static function generate_answer( string $question, array $context_blocks, string $assistant_system_prompt, array $history = array(), string $page_context = '', int $post_id = 0 ) {
		if ( ! function_exists( 'wp_ai_client_prompt' ) ) {
			return new WP_Error(
				'dewey_ai_unavailable',
				__( 'WordPress AI Client is not available on this site.', 'dewey' ),
				array( 'status' => 503 )
			);
		}

		$has_context = ! empty( $context_blocks );

		if ( $has_context ) {
			$system_instruction = __(
				"You are Dewey — a sharp, friendly WordPress admin assistant living inside the dashboard. You have access to this site's archive. Use the provided content snippets to answer. Be conversational and direct. Cite sources inline as [post_id]. No fluff. Use clear Markdown formatting (short paragraphs, bullets when useful). Never claim you cannot access the site's content in this environment.",
				'dewey'
			);
			$context_payload = implode( "\n\n", $context_blocks );
			$user_prompt     = sprintf(
				"Question: %s\n\nArchive context:\n%s\n\nAnswer conversationally. Reference source IDs like [123] inline.",
				$question,
				$context_payload
			);
		} else {
			$system_instruction = __(
				'You are Dewey — a sharp, friendly WordPress admin assistant living inside the dashboard. Answer from your general knowledge. Be conversational, practical, and concise. You know WordPress deeply. No fluff, no disclaimers. Use clear Markdown formatting. Never claim you cannot access the site in this environment.',
				'dewey'
			);
			$user_prompt = $question;
		}

		if ( '' !== trim( $assistant_system_prompt ) ) {
			$system_instruction = trim( $assistant_system_prompt ) . "\n\n" . $system_instruction;
		}

		// Prepend the current admin screen so the AI can give context-aware answers.
		// e.g. if the user is on "edit" they're looking at a posts list; "post" means the editor.
		if ( '' !== $page_context ) {
			$system_instruction = 'Current wp-admin screen: ' . $page_context . "\n\n" . $system_instruction;
		}

		// Prepend the specific post being edited so Dewey can reference it by name.
		$post_context = self::get_current_post_context( $post_id );
		if ( '' !== $post_context ) {
			$system_instruction = $post_context . "\n\n" . $system_instruction;
		}

		// Prepend a brief site overview so the AI can reference real numbers without
		// needing to search the archive first.
		$site_stats = self::get_site_stats_context();
		if ( '' !== $site_stats ) {
			$system_instruction = 'Site overview: ' . $site_stats . "\n\n" . $system_instruction;
		}

		// Ask the model to append follow-up questions in a parseable tag so we can
		// surface them as chips without a second API call.
		$system_instruction .=
			"\n\nAt the very end of your response — after all content — output exactly one line in this format and nothing after it:\n" .
			'<dewey-followups>Q1|Q2|Q3</dewey-followups>' . "\n" .
			'Where Q1, Q2, Q3 are three natural follow-up questions the user might ask next. Each question must be under 80 characters. Do not number them. Do not add any text after the closing tag.';

		$settings          = Dewey_Settings::get_all();
		$tone              = (string) ( $settings['assistant_tone'] ?? 'match' );
		$tone_modifier     = match ( $tone ) {
			'casual'  => ' Tone: relaxed and friendly — use plain everyday language.',
			'precise' => ' Tone: precise and technical — prefer exact terms and be specific.',
			default   => '',
		};
		if ( '' !== $tone_modifier ) {
			$system_instruction .= $tone_modifier;
		}

		$verbosity          = (string) ( $settings['assistant_verbosity'] ?? 'concise' );
		$verbosity_modifier = match ( $verbosity ) {
			'detailed' => ' Verbosity: thorough — explain your reasoning, include relevant context, and use examples where helpful.',
			default    => ' Verbosity: concise — tight paragraphs, no filler, no padding.',
		};
		$system_instruction .= $verbosity_modifier;

		// Prepend recent conversation turns so the AI can handle follow-ups
		// like "tell me more about that" or "which one should I use?".
		if ( ! empty( $history ) ) {
			$history_lines = array();
			foreach ( $history as $turn ) {
				$role  = 'user' === ( $turn['role'] ?? '' ) ? 'User' : 'Dewey';
				$text  = mb_substr( trim( (string) ( $turn['text'] ?? '' ) ), 0, 500 );
				if ( '' !== $text ) {
					$history_lines[] = $role . ': ' . $text;
				}
			}
			if ( ! empty( $history_lines ) ) {
				$history_block = "Previous conversation:\n" . implode( "\n", $history_lines ) . "\n\n";
				$user_prompt   = $history_block . $user_prompt;
			}
		}

		try {
			$prompt = wp_ai_client_prompt( $user_prompt );
			if ( method_exists( $prompt, 'using_system_instruction' ) ) {
				$prompt = $prompt->using_system_instruction( $system_instruction );
			}
			if ( method_exists( $prompt, 'using_temperature' ) ) {
				$prompt = $prompt->using_temperature( 0.55 );
			}
			if ( method_exists( $prompt, 'using_max_tokens' ) ) {
				$prompt = $prompt->using_max_tokens( Dewey_Settings::response_max_tokens() );
			}

			$text = $prompt->generate_text();
			if ( is_wp_error( $text ) ) {
				return new WP_Error(
					'dewey_ai_generation_failed',
					self::safe_error_message( $text ),
					array( 'status' => 502 )
				);
			}
		} catch ( Throwable $e ) {
			return new WP_Error(
				'dewey_ai_generation_failed',
				__( 'AI generation failed unexpectedly.', 'dewey' ),
				array( 'status' => 502 )
			);
		}

		$text = self::enforce_voice_guardrails( (string) $text, $has_context );

		// Extract and strip the follow-up questions tag the model was asked to append.
		$follow_ups = array();
		if ( preg_match( '/<dewey-followups>(.*?)<\/dewey-followups>/si', $text, $fu_match ) ) {
			$text = trim( (string) preg_replace( '/<dewey-followups>.*?<\/dewey-followups>/si', '', $text ) );
			$raw_questions = array_filter(
				array_map( 'trim', explode( '|', $fu_match[1] ) ),
				static function ( string $q ): bool {
					return mb_strlen( $q ) >= 5 && mb_strlen( $q ) <= 120;
				}
			);
			$follow_ups = array_values( array_slice( $raw_questions, 0, 3 ) );
		}

		return array(
			'answer'     => (string) $text,
			'follow_ups' => $follow_ups,
			'provider'   => '',
			'model'      => '',
		);
	}

	/**
	 * @param array<string,mixed> $intent
	 * @return array<string,mixed>|WP_Error
	 */
	private static function apply_non_confirm_settings_intent( array $intent ) {
		$action = (string) ( $intent['action'] ?? '' );
		$params = is_array( $intent['params'] ?? null ) ? $intent['params'] : array();
		if ( 'set_settings' !== $action ) {
			return new WP_Error( 'dewey_unknown_intent', __( 'Unknown settings action.', 'dewey' ), array( 'status' => 400 ) );
		}

		$updated = Dewey_Settings::update( $params );
		return array(
			'answer'    => self::settings_confirmation_message( $params ),
			'citations' => array(),
			'meta'      => array(
				'intent_applied'  => true,
				'updated_setting' => array_keys( $params ),
				'settings'        => $updated,
			),
		);
	}

	/**
	 * @param string $mode
	 * @return string
	 */
	private static function resolve_retrieval_mode( string $mode ): string {
		if ( 'indexed' === $mode ) {
			return Dewey_Indexer::has_index() ? 'indexed' : 'core';
		}
		if ( 'auto' === $mode ) {
			return Dewey_Indexer::has_index() ? 'indexed' : 'core';
		}
		return 'core';
	}

	/**
	 * Generate a Dewey-voiced confirmation for a settings update, referencing
	 * what actually changed rather than using a generic acknowledgment.
	 * Public so the REST controller can call it from the confirm-action route.
	 *
	 * @param array<string,mixed> $params The settings that were updated.
	 * @return string
	 */
	public static function settings_confirmation_for_confirm( array $params ): string {
		return self::settings_confirmation_message( $params );
	}

	/**
	 * @param array<string,mixed> $params The settings that were updated.
	 * @return string
	 */
	private static function settings_confirmation_message( array $params ): string {
		$key   = array_key_first( $params );
		$value = (string) ( $params[ $key ] ?? '' );

		$messages = array(
			'assistant_tone' => array(
				'casual'  => __( 'Done — keeping things relaxed and conversational from here on.', 'dewey' ),
				'precise' => __( 'Done — switching to precise mode. Expect exact terms and no hand-waving.', 'dewey' ),
				'match'   => __( 'Done — I\'ll match the tone to context, as usual.', 'dewey' ),
			),
			'assistant_verbosity' => array(
				'concise'  => __( 'Done — I\'ll keep it tight. No padding.', 'dewey' ),
				'detailed' => __( 'Done — I\'ll explain more thoroughly, with context and examples.', 'dewey' ),
			),
			'citation_style' => array(
				'titles' => __( 'Done — citations will show post titles.', 'dewey' ),
				'links'  => __( 'Done — citations will show full URLs.', 'dewey' ),
			),
			'retrieval_mode' => array(
				'core'    => __( 'Done — using WordPress core search for retrieval.', 'dewey' ),
				'indexed' => __( 'Done — using the Dewey index for retrieval.', 'dewey' ),
				'auto'    => __( 'Done — I\'ll use the index when it\'s available, core otherwise.', 'dewey' ),
			),
		);

		if ( isset( $messages[ $key ][ $value ] ) ) {
			return (string) $messages[ $key ][ $value ];
		}

		// Generic fallback for multi-key updates or unknown keys.
		return __( 'Done — settings updated.', 'dewey' );
	}

	/**
	 * @param WP_Error $error
	 * @return string
	 */
	private static function safe_error_message( WP_Error $error ): string {
		$message = trim( (string) $error->get_error_message() );
		if ( '' === $message ) {
			return __( 'AI generation failed.', 'dewey' );
		}

		return wp_strip_all_tags( $message );
	}

	/**
	 * @param string $value
	 * @param int    $limit
	 * @return string
	 */
	private static function safe_substr( string $value, int $limit ): string {
		if ( function_exists( 'mb_substr' ) ) {
			return (string) mb_substr( $value, 0, $limit );
		}

		return substr( $value, 0, $limit );
	}

	/**
	 * Prevent model disclaimers that conflict with Dewey's in-site contract.
	 *
	 * @param string $text
	 * @param bool   $has_context
	 * @return string
	 */
	private static function enforce_voice_guardrails( string $text, bool $has_context ): string {
		$trimmed = trim( $text );
		if ( '' === $trimmed ) {
			return $trimmed;
		}

		$access_disclaimer_re = '/\b(i\s+(do\s+not|don\'t|cannot|can\'t)\s+(have|access|see)\b|i\s+can\s+only\s+see\b|unless\s+you\s+share\b|only\s+see\s+what\s+you\s+paste\b)/i';
		if ( ! preg_match( $access_disclaimer_re, $trimmed ) ) {
			return $trimmed;
		}

		if ( $has_context ) {
			return __( 'I do have access to your indexed archive context here. Based on what I can see, I will pull the strongest matches and cite them directly.', 'dewey' );
		}

		return __( "I can query this site's archive from inside Dewey. This specific search did not surface direct matches yet, so let's refine the trail and check adjacent tags, dates, or titles.", 'dewey' );
	}
}
