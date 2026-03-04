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
		public $post_type;
		public $post_status;

		public function __construct( $id = 0, $excerpt = '', $content = '', $post_type = 'post', $post_status = 'publish' ) {
			$this->ID           = (int) $id;
			$this->post_excerpt = $excerpt;
			$this->post_content = $content;
			$this->post_type    = (string) $post_type;
			$this->post_status  = (string) $post_status;
		}
	}
}

if ( ! class_exists( 'WP_Term' ) ) {
	class WP_Term {
		public $name;
		public $count;

		public function __construct( $name = '', $count = 0 ) {
			$this->name  = (string) $name;
			$this->count = (int) $count;
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

if ( ! function_exists( 'delete_transient' ) ) {
	function delete_transient( $key ) {
		unset( $GLOBALS['dewey_test_transients'][ $key ] );
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

if ( ! function_exists( '_n' ) ) {
	function _n( $single, $plural, $number ) {
		return 1 === (int) $number ? $single : $plural;
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

if ( ! function_exists( 'wp_count_posts' ) ) {
	function wp_count_posts() {
		return (object) array(
			'publish' => 2,
			'draft'   => 1,
			'inherit' => 5,
		);
	}
}

if ( ! function_exists( 'get_posts' ) ) {
	function get_posts() {
		return array();
	}
}

if ( ! function_exists( 'get_the_date' ) ) {
	function get_the_date() {
		return gmdate( 'Y-m-d' );
	}
}

if ( ! function_exists( 'get_terms' ) ) {
	function get_terms() {
		return array();
	}
}

if ( ! function_exists( 'get_the_terms' ) ) {
	function get_the_terms( $post_id, $taxonomy ) {
		return $GLOBALS['dewey_test_terms'][ $post_id ][ $taxonomy ] ?? array();
	}
}

if ( ! function_exists( 'dewey_ai_connection_status' ) ) {
	function dewey_ai_connection_status() {
		return true;
	}
}

if ( ! function_exists( 'dewey_ai_connection_debug' ) ) {
	function dewey_ai_connection_debug() {
		return array( 'ok' => true );
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

require_once __DIR__ . '/../../includes/class-dewey-knowledge.php';
require_once __DIR__ . '/../../includes/class-dewey-settings.php';
require_once __DIR__ . '/../../includes/class-dewey-intent-router.php';
require_once __DIR__ . '/../../includes/class-dewey-indexer.php';
require_once __DIR__ . '/../../includes/class-dewey-rest-controller.php';
require_once __DIR__ . '/../../includes/class-dewey-action-handler.php';
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
	count( $GLOBALS['dewey_test_registered_routes'] ) >= 4
);
$query_route = null;
foreach ( $GLOBALS['dewey_test_registered_routes'] as $route ) {
	if ( '/query' === ( $route['route'] ?? '' ) ) {
		$query_route = $route;
		break;
	}
}
assert_true(
	'REST query route includes screen_context argument',
	is_array( $query_route ) &&
		isset( $query_route['args']['args']['screen_context'] )
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

$engine_fast_path = Dewey_Engine::answer_question( 'thanks' );
assert_true(
	'Engine uses deterministic fast path for tiny social chatter',
	is_array( $engine_fast_path ) &&
		0 === count( $engine_fast_path['citations'] ?? array() ) &&
		'' !== trim( (string) ( $engine_fast_path['answer'] ?? '' ) )
);

$engine_refine = Dewey_Engine::answer_question( 'Do we have any posts about onboarding?' );
assert_true(
	'Engine asks for refinement when archive lookup has no hits',
	is_array( $engine_refine ) &&
		str_contains( (string) ( $engine_refine['answer'] ?? '' ), 'concrete anchor' ) &&
		3 === count( $engine_refine['follow_ups'] ?? array() )
);

$GLOBALS['dewey_test_wp_query_posts'] = array(
	new WP_Post( 101, 'Snippet one', 'Body one', 'post', 'publish' ),
	new WP_Post( 102, 'Snippet two', 'Body two', 'post', 'publish' ),
);
$engine_clarify = Dewey_Engine::answer_question( 'Do we have posts about onboarding?' );
assert_true(
	'Engine asks for clarification on low-confidence retrieval',
	is_array( $engine_clarify ) &&
		str_contains( strtolower( (string) ( $engine_clarify['answer'] ?? '' ) ), 'confidence is low' )
);

$GLOBALS['dewey_test_wp_query_posts'] = array(
	new WP_Post( 201, 'Page snippet', 'Page body', 'page', 'publish' ),
	new WP_Post( 202, 'Post snippet', 'Post body', 'post', 'publish' ),
);
$engine_screen_filtered = Dewey_Engine::answer_question(
	'What content do we have?',
	'',
	array(),
	'edit',
	0,
	array(
		'base'      => 'edit',
		'post_type' => 'page',
	)
);
assert_true(
	'Screen context post_type filter narrows retrieval',
	is_array( $engine_screen_filtered ) &&
		1 === count( $engine_screen_filtered['citations'] ?? array() ) &&
		201 === (int) ( $engine_screen_filtered['citations'][0]['post_id'] ?? 0 )
);

$sanitized_screen_context = Dewey_REST_Controller::sanitize_screen_context(
	array(
		'base'      => 'plugins',
		'post_type' => 'post',
		'title'     => 'Plugins',
		'stats'     => array(
			'total_plugins'  => '12',
			'active_plugins' => 9,
		),
	)
);
assert_true(
	'REST controller sanitizes screen context payload',
	'plugins' === ( $sanitized_screen_context['base'] ?? '' ) &&
		12 === (int) ( $sanitized_screen_context['stats']['total_plugins'] ?? 0 )
);

$sanitized_history = Dewey_REST_Controller::sanitize_history(
	array(
		array( 'role' => 'user', 'text' => str_repeat( 'A', 500 ) ),
		array( 'role' => 'assistant', 'text' => 'ok' ),
		array( 'role' => 'user', 'text' => 'q3' ),
		array( 'role' => 'assistant', 'text' => 'a4' ),
		array( 'role' => 'user', 'text' => 'q5' ),
		array( 'role' => 'assistant', 'text' => 'a6' ),
		array( 'role' => 'user', 'text' => 'q7 should be dropped' ),
	)
);
assert_true(
	'REST history sanitization enforces tighter turn and size caps',
	6 === count( $sanitized_history ) &&
		320 === strlen( (string) ( $sanitized_history[0]['text'] ?? '' ) )
);

$GLOBALS['dewey_test_wp_query_posts'] = array();
$rest_query_refine = Dewey_REST_Controller::query(
	new WP_REST_Request(
		array(
			'question' => 'Do we have any posts about onboarding?',
		),
		array()
	)
);
assert_true(
	'REST query returns deterministic no-hit refinement payload',
	is_array( $rest_query_refine ) &&
		0 === count( $rest_query_refine['citations'] ?? array() ) &&
		3 === count( $rest_query_refine['follow_ups'] ?? array() )
);

$GLOBALS['dewey_test_options'][ Dewey_Indexer::INDEX_OPTION_KEY ] = array(
	'generated_at'   => gmdate( 'c', time() - 120 ),
	'avg_doc_length' => 80,
	'items'          => array(
		array(
			'post_id'    => 77,
			'title'      => 'Welcome Onboarding',
			'permalink'  => 'https://example.com/?p=77',
			'snippet'    => 'General content',
			'tags_text'  => 'customer onboarding retention',
			'cats_text'  => 'growth',
			'word_count' => 80,
			'modified'   => gmdate( 'c' ),
		),
	),
);
$index_term_results = Dewey_Indexer::search_index( 'retention' );
assert_true(
	'Indexed search can match taxonomy phrase fields',
	is_array( $index_term_results ) &&
		77 === (int) ( $index_term_results[0]['post_id'] ?? 0 )
);

$GLOBALS['dewey_test_options'][ Dewey_Indexer::INDEX_OPTION_KEY ]['generated_at'] = gmdate( 'c', time() - 900 );
$GLOBALS['dewey_test_filters']['dewey_index_stale_after_seconds'] = 300;
$status_response = Dewey_REST_Controller::status(
	new WP_REST_Request(
		array( 'debug' => false ),
		array()
	)
);
assert_true(
	'Status exposes index staleness health and telemetry',
	is_array( $status_response ) &&
		true === ( $status_response['index_health']['is_stale'] ?? false ) &&
		is_array( $status_response['telemetry'] ?? null ) &&
		is_array( $status_response['integrity'] ?? null ) &&
		array_key_exists( 'prompt_chars_total', $status_response['telemetry'] ) &&
		array_key_exists( 'fast_path_responses', $status_response['telemetry'] )
);

$eval_fixture_path = __DIR__ . '/../evals/retrieval-evals.json';
$eval_payload      = json_decode( (string) file_get_contents( $eval_fixture_path ), true );
assert_true(
	'Eval fixture dataset loads',
	is_array( $eval_payload ) &&
		is_array( $eval_payload['cases'] ?? null ) &&
		count( $eval_payload['cases'] ) >= 3
);
foreach ( $eval_payload['cases'] as $eval_case ) {
	$question = (string) ( $eval_case['question'] ?? '' );
	if ( '' === $question ) {
		continue;
	}
	$eval_result = Dewey_Engine::answer_question( $question );
	assert_true(
		'Eval replay returns structured result for fixture question',
		is_array( $eval_result ) || is_wp_error( $eval_result )
	);
}

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
