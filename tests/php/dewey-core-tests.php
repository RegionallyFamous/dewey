<?php
/**
 * Lightweight PHP tests for Dewey core classes.
 *
 * Run with:
 *   php ./tests/php/dewey-core-tests.php
 */

define( 'ABSPATH', __DIR__ . '/' );

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
	function get_option() {
		return array();
	}
}

if ( ! function_exists( 'update_option' ) ) {
	function update_option() {
		return true;
	}
}

if ( ! function_exists( 'get_post_types' ) ) {
	function get_post_types() {
		return array( 'post', 'page' );
	}
}

if ( ! function_exists( 'get_post_stati' ) ) {
	function get_post_stati() {
		return array( 'publish', 'private' );
	}
}

require_once __DIR__ . '/../../includes/class-dewey-settings.php';
require_once __DIR__ . '/../../includes/class-dewey-intent-router.php';

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
