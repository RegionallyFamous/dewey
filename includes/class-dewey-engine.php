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
	 * @param string $question
	 * @return array<string,mixed>|WP_Error
	 */
	public static function answer_question( string $question ) {
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

		if ( empty( $retrieval['citations'] ) ) {
			return array(
				'answer'    => __( "I couldn't find a strong match in your current archive.", 'dewey' ),
				'citations' => array(),
				'meta'      => array(
					'retrieval_mode' => $retrieval['retrieval_mode'],
					'result_count'   => 0,
				),
			);
		}

		$answer_result = self::generate_answer( $question, $retrieval['context_blocks'] );
		if ( is_wp_error( $answer_result ) ) {
			return $answer_result;
		}

		return array(
			'answer'    => $answer_result['answer'],
			'citations' => $retrieval['citations'],
			'meta'      => array(
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

		$raw_results = 'indexed' === $effective_mode
			? Dewey_Indexer::search_index( $question )
			: self::search_core( $question );
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

			$snippet = mb_substr( $snippet, 0, $max_content );
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
	 * @param array<int,string> $context_blocks
	 * @return array<string,string>|WP_Error
	 */
	private static function generate_answer( string $question, array $context_blocks ) {
		if ( ! function_exists( 'wp_ai_client_prompt' ) ) {
			return new WP_Error(
				'dewey_ai_unavailable',
				__( 'WordPress AI Client is not available on this site.', 'dewey' ),
				array( 'status' => 503 )
			);
		}

		$system_instruction = __(
			'You are Dewey, a WordPress editorial archive assistant. Use only the provided context snippets. If context is insufficient, say so clearly. Keep answers concise and practical.',
			'dewey'
		);
		$context_payload = implode( "\n\n", $context_blocks );
		$user_prompt     = sprintf(
			"Question: %s\n\nContext:\n%s\n\nWrite a helpful answer with references to source IDs like [123].",
			$question,
			$context_payload
		);

		try {
			$prompt = wp_ai_client_prompt( $user_prompt );
			if ( method_exists( $prompt, 'using_system_instruction' ) ) {
				$prompt = $prompt->using_system_instruction( $system_instruction );
			}
			if ( method_exists( $prompt, 'using_temperature' ) ) {
				$prompt = $prompt->using_temperature( 0.2 );
			}
			if ( method_exists( $prompt, 'using_max_tokens' ) ) {
				$prompt = $prompt->using_max_tokens( Dewey_Settings::response_max_tokens() );
			}
			if ( method_exists( $prompt, 'using_model_preference' ) ) {
				$prompt = $prompt->using_model_preference(
					array( 'google', 'gemini-3-pro-preview' ),
					array( 'anthropic', 'claude-sonnet-4-5' ),
					array( 'openai', 'gpt-5.1' )
				);
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

		return array(
			'answer'   => (string) $text,
			'provider' => '',
			'model'    => '',
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
			'answer'    => __( 'Done. I updated your Dewey settings.', 'dewey' ),
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
}
