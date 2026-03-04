<?php
declare(strict_types=1);
/**
 * Dewey_REST_Controller
 *
 * REST routes for Dewey engine.
 *
 * @package Dewey
 */

defined( 'ABSPATH' ) || exit;

final class Dewey_REST_Controller {
	const NAMESPACE = 'dewey/v1';
	const TOKEN_TTL = 600;

	/**
	 * @return void
	 */
	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/query',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( __CLASS__, 'can_query' ),
				'callback'            => array( __CLASS__, 'query' ),
			'args'                => array(
				'question' => array(
					'type'              => 'string',
					'required'          => true,
					'sanitize_callback' => array( __CLASS__, 'sanitize_question' ),
				),
				'assistant_system_prompt' => array(
					'type'              => 'string',
					'required'          => false,
					'default'           => '',
					'sanitize_callback' => array( __CLASS__, 'sanitize_assistant_prompt' ),
				),
				'history' => array(
					'type'              => 'array',
					'required'          => false,
					'default'           => array(),
					'sanitize_callback' => array( __CLASS__, 'sanitize_history' ),
				),
				'page_context' => array(
					'type'              => 'string',
					'required'          => false,
					'default'           => '',
					'sanitize_callback' => array( __CLASS__, 'sanitize_page_context' ),
				),
				'post_id' => array(
					'type'              => 'integer',
					'required'          => false,
					'default'           => 0,
					'sanitize_callback' => 'absint',
				),
			),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/status',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => array( __CLASS__, 'can_status' ),
				'callback'            => array( __CLASS__, 'status' ),
				'args'                => array(
					'debug' => array(
						'type'    => 'boolean',
						'default' => false,
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/reindex',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( __CLASS__, 'can_reindex' ),
				'callback'            => array( __CLASS__, 'reindex' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/confirm-action',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => array( __CLASS__, 'can_reindex' ),
				'callback'            => array( __CLASS__, 'confirm_action' ),
				'args'                => array(
					'token' => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'approved' => array(
						'type'    => 'boolean',
						'default' => true,
					),
				),
			)
		);
	}

	/**
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public static function query( WP_REST_Request $request ) {
		$rate = self::enforce_rate_limit( 'query' );
		if ( is_wp_error( $rate ) ) {
			return $rate;
		}

		$question         = (string) $request->get_param( 'question' );
		$assistant_prompt = (string) $request->get_param( 'assistant_system_prompt' );
		$history          = $request->get_param( 'history' );
		$history          = is_array( $history ) ? $history : array();
		$page_context     = (string) $request->get_param( 'page_context' );
		$post_id          = (int) $request->get_param( 'post_id' );
		$result           = Dewey_Engine::answer_question( $question, $assistant_prompt, $history, $page_context, $post_id );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( $result );
	}

	/**
	 * @return WP_REST_Response|WP_Error
	 */
	public static function status( WP_REST_Request $request ) {
		$rate = self::enforce_rate_limit( 'status' );
		if ( is_wp_error( $rate ) ) {
			return $rate;
		}

		$settings = Dewey_Settings::get_all();
		$response = array(
			'ai_connected'     => dewey_ai_connection_status(),
			'retrieval_mode'   => (string) ( $settings['retrieval_mode'] ?? 'core' ),
			'index'            => Dewey_Indexer::status(),
			'guardrails'       => array(
				'search_max_results'  => Dewey_Settings::search_max_results(),
				'search_max_content'  => Dewey_Settings::search_max_content(),
				'response_max_tokens' => Dewey_Settings::response_max_tokens(),
			),
			'routes_available' => array(
				'query'          => true,
				'status'         => true,
				'reindex'        => current_user_can( 'manage_options' ),
				'confirm_action' => current_user_can( 'manage_options' ),
			),
		);

		$debug_requested = (bool) $request->get_param( 'debug' );
		if ( $debug_requested && current_user_can( 'manage_options' ) ) {
			$response['ai_connection_debug'] = dewey_ai_connection_debug();
		}

		return rest_ensure_response( $response );
	}

	/**
	 * @return WP_REST_Response|WP_Error
	 */
	public static function reindex() {
		$rate = self::enforce_rate_limit( 'reindex' );
		if ( is_wp_error( $rate ) ) {
			return $rate;
		}

		$status = Dewey_Indexer::rebuild();
		return rest_ensure_response(
			array(
				'ok'      => true,
				'message' => __( 'Dewey index rebuild complete.', 'dewey' ),
				'index'   => $status,
			)
		);
	}

	/**
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public static function confirm_action( WP_REST_Request $request ) {
		$rate = self::enforce_rate_limit( 'confirm_action' );
		if ( is_wp_error( $rate ) ) {
			return $rate;
		}

		$approved = (bool) $request->get_param( 'approved' );
		if ( ! $approved ) {
			return rest_ensure_response(
				array(
					'ok'      => true,
					'message' => __( 'Action canceled.', 'dewey' ),
				)
			);
		}

		$token_data = self::verify_confirm_token( (string) $request->get_param( 'token' ) );
		if ( is_wp_error( $token_data ) ) {
			return $token_data;
		}

		$action = (string) ( $token_data['action'] ?? '' );
		$params = is_array( $token_data['params'] ?? null ) ? $token_data['params'] : array();

		if ( 'reindex_now' === $action ) {
			$status = Dewey_Indexer::rebuild();
			return rest_ensure_response(
				array(
					'ok'      => true,
					'message' => __( 'Confirmed: full reindex complete.', 'dewey' ),
					'index'   => $status,
				)
			);
		}

		if ( 'set_settings' === $action ) {
			$updated = Dewey_Settings::update( $params );
			return rest_ensure_response(
				array(
					'ok'      => true,
					'message' => Dewey_Engine::settings_confirmation_for_confirm( $params ),
					'settings' => $updated,
				)
			);
		}

		return new WP_Error( 'dewey_unknown_confirm_action', __( 'Unknown confirm action.', 'dewey' ), array( 'status' => 400 ) );
	}

	/**
	 * @param WP_REST_Request $request
	 * @return bool|WP_Error
	 */
	public static function can_query( WP_REST_Request $request ) {
		return self::authorize( $request, 'edit_posts' );
	}

	/**
	 * @param WP_REST_Request $request
	 * @return bool|WP_Error
	 */
	public static function can_status( WP_REST_Request $request ) {
		return self::authorize( $request, 'edit_posts' );
	}

	/**
	 * @param WP_REST_Request $request
	 * @return bool|WP_Error
	 */
	public static function can_reindex( WP_REST_Request $request ) {
		return self::authorize( $request, 'manage_options' );
	}

	/**
	 * @param WP_REST_Request $request
	 * @param string          $capability
	 * @return bool|WP_Error
	 */
	private static function authorize( WP_REST_Request $request, string $capability ) {
		if ( ! current_user_can( $capability ) ) {
			return new WP_Error( 'dewey_forbidden', __( 'You do not have permission for this Dewey action.', 'dewey' ), array( 'status' => 403 ) );
		}

		$nonce_result = self::verify_rest_nonce( $request );
		if ( is_wp_error( $nonce_result ) ) {
			return $nonce_result;
		}

		return true;
	}

	/**
	 * @param WP_REST_Request $request
	 * @return bool|WP_Error
	 */
	private static function verify_rest_nonce( WP_REST_Request $request ) {
		if ( ! function_exists( 'wp_verify_nonce' ) ) {
			return true;
		}

		$nonce = $request->get_header( 'x_wp_nonce' );
		if ( '' === $nonce ) {
			$nonce = (string) $request->get_param( '_wpnonce' );
		}
		if ( '' === $nonce ) {
			return new WP_Error( 'dewey_missing_nonce', __( 'Missing REST nonce.', 'dewey' ), array( 'status' => 403 ) );
		}

		if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return new WP_Error( 'dewey_invalid_nonce', __( 'Invalid REST nonce.', 'dewey' ), array( 'status' => 403 ) );
		}

		return true;
	}

	/**
	 * @param string $route
	 * @return true|WP_Error
	 */
	private static function enforce_rate_limit( string $route ) {
		$user_id = (int) get_current_user_id();
		if ( $user_id <= 0 ) {
			return true;
		}

		$limits = apply_filters(
			'dewey_rate_limit_per_minute',
			array(
				'query'          => 20,
				'status'         => 60,
				'reindex'        => 5,
				'confirm_action' => 10,
			)
		);
		$limit  = absint( $limits[ $route ] ?? 20 );
		if ( $limit <= 0 ) {
			return true;
		}

		$key    = sprintf( 'dewey_rl_%s_%d', sanitize_key( $route ), $user_id );
		$bucket = get_transient( $key );
		$bucket = is_array( $bucket ) ? $bucket : array( 'count' => 0, 'started' => time() );

		$now = time();
		if ( $now - absint( $bucket['started'] ?? 0 ) >= 60 ) {
			$bucket = array(
				'count'   => 0,
				'started' => $now,
			);
		}

		$bucket['count'] = absint( $bucket['count'] ?? 0 ) + 1;
		set_transient( $key, $bucket, 60 );

		if ( $bucket['count'] > $limit ) {
			return new WP_Error(
				'dewey_rate_limited',
				__( 'Rate limit exceeded. Please wait a moment and try again.', 'dewey' ),
				array( 'status' => 429 )
			);
		}

		return true;
	}

	/**
	 * @param string $question
	 * @return string
	 */
	public static function sanitize_question( string $question ): string {
		$value = wp_strip_all_tags( $question );
		$value = preg_replace( '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', (string) $value );
		return self::safe_substr( trim( (string) $value ), 500 );
	}

	/**
	 * @param string $prompt
	 * @return string
	 */
	public static function sanitize_assistant_prompt( string $prompt ): string {
		$value = sanitize_textarea_field( $prompt );
		$value = preg_replace( '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', (string) $value );
		return self::safe_substr( trim( (string) $value ), 2400 );
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
	 * Sanitize conversation history sent from the frontend.
	 *
	 * Accepts up to 10 turns, each with a 'role' (user|assistant) and a 'text'
	 * string capped at 500 characters. Invalid entries are silently dropped.
	 *
	 * @param mixed $history
	 * @return array<int,array{role:string,text:string}>
	 */
	public static function sanitize_history( $history ): array {
		if ( ! is_array( $history ) ) {
			return array();
		}

		$sanitized = array();
		foreach ( array_slice( $history, 0, 10 ) as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$role = (string) ( $item['role'] ?? '' );
			if ( ! in_array( $role, array( 'user', 'assistant' ), true ) ) {
				continue;
			}
			$text = wp_strip_all_tags( (string) ( $item['text'] ?? '' ) );
			$text = preg_replace( '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', (string) $text );
			$text = self::safe_substr( trim( (string) $text ), 500 );
			if ( '' === $text ) {
				continue;
			}
			$sanitized[] = array(
				'role' => $role,
				'text' => $text,
			);
		}

		return $sanitized;
	}

	/**
	 * Sanitize the page_context string sent from the frontend (window.pagenow).
	 * Accepts only lowercase alphanumeric characters and hyphens, max 80 chars.
	 *
	 * @param mixed $context
	 * @return string
	 */
	public static function sanitize_page_context( $context ): string {
		$value = sanitize_key( (string) $context );
		return self::safe_substr( $value, 80 );
	}

	/**
	 * @param string $action
	 * @param array  $params
	 * @return string
	 */
	public static function create_confirm_token( string $action, array $params ): string {
		$payload = array(
			'action'  => sanitize_key( $action ),
			'params'  => Dewey_Settings::sanitize_all( $params ),
			'expires' => time() + self::TOKEN_TTL,
		);
		$json    = wp_json_encode( $payload );
		$encoded = rawurlencode( (string) $json );
		$sig     = hash_hmac( 'sha256', $encoded, wp_salt( 'auth' ) );

		return $encoded . '.' . $sig;
	}

	/**
	 * @param string $token
	 * @return array<string,mixed>|WP_Error
	 */
	private static function verify_confirm_token( string $token ) {
		$parts = explode( '.', $token, 2 );
		if ( 2 !== count( $parts ) ) {
			return new WP_Error( 'dewey_bad_token', __( 'Invalid confirmation token.', 'dewey' ), array( 'status' => 400 ) );
		}

		list( $encoded, $sig ) = $parts;
		$expected = hash_hmac( 'sha256', $encoded, wp_salt( 'auth' ) );
		if ( ! hash_equals( $expected, $sig ) ) {
			return new WP_Error( 'dewey_bad_token', __( 'Invalid confirmation token.', 'dewey' ), array( 'status' => 400 ) );
		}

		$decoded = json_decode( rawurldecode( $encoded ), true );
		if ( ! is_array( $decoded ) ) {
			return new WP_Error( 'dewey_bad_token', __( 'Invalid confirmation token.', 'dewey' ), array( 'status' => 400 ) );
		}

		if ( absint( $decoded['expires'] ?? 0 ) < time() ) {
			return new WP_Error( 'dewey_token_expired', __( 'Confirmation token expired.', 'dewey' ), array( 'status' => 400 ) );
		}

		return $decoded;
	}
}
