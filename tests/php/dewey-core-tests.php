<?php
/**
 * Lightweight PHP tests for Dewey core classes.
 *
 * Run with:
 *   php ./tests/php/dewey-core-tests.php
 */

define( 'ABSPATH', __DIR__ . '/' );

if ( ! class_exists( 'WP_Error' ) ) {
	class WP_Error {
		public $code;
		public $message;
		public $data;

		public function __construct( $code = '', $message = '', $data = null ) {
			$this->code    = $code;
			$this->message = $message;
			$this->data    = $data;
		}

		public function get_error_message() {
			return (string) $this->message;
		}
	}
}

if ( ! function_exists( 'is_wp_error' ) ) {
	function is_wp_error( $thing ) {
		return $thing instanceof WP_Error;
	}
}

if ( ! class_exists( 'WP_REST_Server' ) ) {
	class WP_REST_Server {
		const CREATABLE = 'POST';
		const READABLE  = 'GET';
	}
}

if ( ! class_exists( 'WP_REST_Request' ) ) {
	class WP_REST_Request {
		private $params;
		private $headers;

		public function __construct( array $params = array(), array $headers = array() ) {
			$this->params  = $params;
			$this->headers = $headers;
		}

		public function get_param( $key ) {
			return $this->params[ $key ] ?? null;
		}

		public function get_header( $key ) {
			$key = strtolower( (string) $key );
			return (string) ( $this->headers[ $key ] ?? '' );
		}
	}
}

if ( ! class_exists( 'WP_Post' ) ) {
	class WP_Post {
		public $ID;
		public $post_excerpt;
		public $post_content;

		public function __construct( $id = 0, $excerpt = '', $content = '' ) {
			$this->ID           = (int) $id;
			$this->post_excerpt = $excerpt;
			$this->post_content = $content;
		}
	}
}

if ( ! class_exists( 'WP_Query' ) ) {
	class WP_Query {
		public $posts = array();
		public function __construct( $args = array() ) {
			$this->posts = $GLOBALS['dewey_test_wp_query_posts'] ?? array();
		}
	}
}

if ( ! function_exists( 'sanitize_key' ) ) {
	function sanitize_key( $key ) {
		$key = strtolower( (string) $key );
		return preg_replace( '/[^a-z0-9_\-]/', '', $key );
	}
}

if ( ! function_exists( 'absint' ) ) {
	function absint( $value ) {
		return abs( (int) $value );
	}
}

if ( ! function_exists( 'wp_parse_args' ) ) {
	function wp_parse_args( $args, $defaults = array() ) {
		return array_merge( $defaults, is_array( $args ) ? $args : array() );
	}
}

if ( ! function_exists( 'get_option' ) ) {
	function get_option( $key = '', $default = array() ) {
		return $GLOBALS['dewey_test_options'][ $key ] ?? $default;
	}
}

if ( ! function_exists( 'update_option' ) ) {
	function update_option( $key, $value ) {
		$GLOBALS['dewey_test_options'][ $key ] = $value;
		return true;
	}
}

if ( ! function_exists( 'get_transient' ) ) {
	function get_transient( $key ) {
		return $GLOBALS['dewey_test_transients'][ $key ] ?? false;
	}
}

if ( ! function_exists( 'set_transient' ) ) {
	function set_transient( $key, $value ) {
		$GLOBALS['dewey_test_transients'][ $key ] = $value;
		return true;
	}
}

if ( ! function_exists( 'get_post_types' ) ) {
	function get_post_types() {
		return array( 'post', 'page' );
	}
}

if ( ! function_exists( 'get_post_stati' ) ) {
	function get_post_stati( $args = array() ) {
		$all = array( 'publish', 'private', 'draft', 'pending', 'future' );
		if ( is_array( $args ) && ! empty( $args['public'] ) ) {
			return array( 'publish' );
		}
		return $all;
	}
}

if ( ! function_exists( 'apply_filters' ) ) {
	function apply_filters( $hook, $value ) {
		return $GLOBALS['dewey_test_filters'][ $hook ] ?? $value;
	}
}

if ( ! function_exists( 'register_rest_route' ) ) {
	function register_rest_route( $namespace, $route, $args ) {
		$GLOBALS['dewey_test_registered_routes'][] = array(
			'namespace' => $namespace,
			'route'     => $route,
			'args'      => $args,
		);
		return true;
	}
}

if ( ! function_exists( 'rest_ensure_response' ) ) {
	function rest_ensure_response( $value ) {
		return $value;
	}
}

if ( ! function_exists( '__' ) ) {
	function __( $text ) {
		return $text;
	}
}

if ( ! function_exists( 'sanitize_text_field' ) ) {
	function sanitize_text_field( $value ) {
		return trim( wp_strip_all_tags( (string) $value ) );
	}
}

if ( ! function_exists( 'wp_strip_all_tags' ) ) {
	function wp_strip_all_tags( $text ) {
		return strip_tags( (string) $text );
	}
}

if ( ! function_exists( 'wp_trim_words' ) ) {
	function wp_trim_words( $text ) {
		return trim( (string) $text );
	}
}

if ( ! function_exists( 'wp_json_encode' ) ) {
	function wp_json_encode( $data ) {
		return json_encode( $data );
	}
}

if ( ! function_exists( 'wp_salt' ) ) {
	function wp_salt() {
		return 'dewey-test-salt';
	}
}

if ( ! function_exists( 'current_user_can' ) ) {
	function current_user_can( $capability ) {
		return ! empty( $GLOBALS['dewey_test_caps'][ $capability ] );
	}
}

if ( ! function_exists( 'get_current_user_id' ) ) {
	function get_current_user_id() {
		return 123;
	}
}

if ( ! function_exists( 'wp_verify_nonce' ) ) {
	function wp_verify_nonce( $nonce ) {
		return 'valid-nonce' === $nonce;
	}
}

if ( ! function_exists( 'function_exists' ) ) {
	function function_exists( $name ) {
		return \function_exists( $name );
	}
}

if ( ! function_exists( 'get_post' ) ) {
	function get_post( $post_id ) {
		return $GLOBALS['dewey_test_posts'][ $post_id ] ?? null;
	}
}

if ( ! function_exists( 'get_the_title' ) ) {
	function get_the_title( $post ) {
		return 'Title ' . (int) $post->ID;
	}
}

if ( ! function_exists( 'get_permalink' ) ) {
	function get_permalink( $post ) {
		return 'https://example.com/?p=' . (int) $post->ID;
	}
}

if ( ! function_exists( 'get_post_modified_time' ) ) {
	function get_post_modified_time() {
		return gmdate( 'c' );
	}
}

if ( ! function_exists( 'wp_ai_client_prompt' ) ) {
	function wp_ai_client_prompt() {
		return new class() {
			public function using_system_instruction() {
				return $this;
			}
			public function using_temperature() {
				return $this;
			}
			public function using_max_tokens() {
				return $this;
			}
			public function using_model_preference() {
				return $this;
			}
			public function generate_text() {
				return 'Test answer.';
			}
		};
	}
}

require_once __DIR__ . '/../../includes/class-dewey-settings.php';
require_once __DIR__ . '/../../includes/class-dewey-intent-router.php';
require_once __DIR__ . '/../../includes/class-dewey-indexer.php';
require_once __DIR__ . '/../../includes/class-dewey-rest-controller.php';
require_once __DIR__ . '/../../includes/class-dewey-engine.php';

assert_true(
	'Dewey_Settings sanitizes invalid retrieval mode',
	'core' === Dewey_Settings::sanitize_all(
		array( 'retrieval_mode' => 'invalid-mode' )
	)['retrieval_mode']
);

assert_true(
	'Dewey_Settings clamps numeric bounds',
	20 === Dewey_Settings::sanitize_all(
		array( 'search_max_results' => 999 )
	)['search_max_results']
);

assert_true(
	'Dewey_Settings filters unknown post types',
	array( 'post' ) === Dewey_Settings::sanitize_all(
		array( 'indexed_post_types' => array( 'post', 'custom' ) )
	)['indexed_post_types']
);

$GLOBALS['dewey_test_caps'] = array( 'manage_options' => true );
assert_true(
	'Dewey_Settings allows draft status only with explicit nonpublic opt-in',
	array( 'publish', 'draft' ) === Dewey_Settings::sanitize_all(
		array(
			'allow_nonpublic_indexing' => true,
			'indexed_statuses'         => array( 'publish', 'draft' ),
		)
	)['indexed_statuses']
);
assert_true(
	'Dewey_Settings blocks draft status when nonpublic opt-in is disabled',
	array( 'publish' ) === Dewey_Settings::sanitize_all(
		array(
			'allow_nonpublic_indexing' => false,
			'indexed_statuses'         => array( 'publish', 'draft' ),
		)
	)['indexed_statuses']
);

$router = new Dewey_Intent_Router();

$route_reindex = $router->route( 'Please run a full reindex of the archive' );
assert_true(
	'Intent router maps reindex intents',
	'settings' === $route_reindex['type'] &&
	'reindex_now' === $route_reindex['action'] &&
	true === $route_reindex['requires_confirm']
);

$route_core = $router->route( 'switch retrieval to wordpress core' );
assert_true(
	'Intent router maps retrieval core intent',
	'settings' === $route_core['type'] &&
	'core' === $route_core['params']['retrieval_mode']
);

$route_archive = $router->route( 'what did i write about customer research?' );
assert_true(
	'Intent router falls back to archive intent',
	'archive' === $route_archive['type']
);

$route_include_drafts = $router->route( 'please include drafts in indexing' );
assert_true(
	'Intent router maps draft indexing enable intent',
	'settings' === $route_include_drafts['type'] &&
		true === ( $route_include_drafts['requires_confirm'] ?? false ) &&
		true === ( $route_include_drafts['params']['allow_nonpublic_indexing'] ?? false )
);

$GLOBALS['dewey_test_registered_routes'] = array();
Dewey_REST_Controller::register_routes();
assert_true(
	'REST routes registered',
	4 === count( $GLOBALS['dewey_test_registered_routes'] )
);

$request_missing_nonce = new WP_REST_Request( array(), array() );
$GLOBALS['dewey_test_caps'] = array( 'edit_posts' => true, 'manage_options' => true );
$can_query_missing_nonce = Dewey_REST_Controller::can_query( $request_missing_nonce );
assert_true(
	'Route permission rejects missing nonce',
	is_wp_error( $can_query_missing_nonce )
);

$request_with_nonce = new WP_REST_Request( array(), array( 'x_wp_nonce' => 'valid-nonce' ) );
$can_query = Dewey_REST_Controller::can_query( $request_with_nonce );
assert_true(
	'Route permission accepts valid nonce and capability',
	true === $can_query
);

$token = Dewey_REST_Controller::create_confirm_token(
	'set_settings',
	array( 'retrieval_mode' => 'core' )
);
$confirm_response = Dewey_REST_Controller::confirm_action(
	new WP_REST_Request(
		array(
			'token'    => $token,
			'approved' => true,
		),
		array()
	)
);
assert_true(
	'Confirm action applies settings token',
	is_array( $confirm_response ) &&
		true === ( $confirm_response['ok'] ?? false )
);

$engine_error = Dewey_Engine::answer_question( '' );
assert_true(
	'Engine rejects empty questions',
	is_wp_error( $engine_error )
);

$engine_refine = Dewey_Engine::answer_question( 'Do we have any posts about onboarding?' );
assert_true(
	'Engine asks for refinement when archive lookup has no hits',
	is_array( $engine_refine ) &&
		str_contains( (string) ( $engine_refine['answer'] ?? '' ), 'concrete anchor' ) &&
		3 === count( $engine_refine['follow_ups'] ?? array() )
);

echo "PHP core tests passed.\n";

/**
 * @param string $label
 * @param bool   $condition
 * @return void
 */
function assert_true( string $label, bool $condition ): void {
	if ( $condition ) {
		return;
	}

	fwrite( STDERR, "Assertion failed: {$label}\n" );
	exit( 1 );
}
