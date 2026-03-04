<?php
/**
 * Plugin Name: Dewey AI Search Assistant
 * Plugin URI: https://github.com/regionally-famous/dewey
 * Description: Dewey brings live archive query and AI answers into wp-admin, with citations and built-in guardrails powered by WordPress 7.0 core capabilities.
 * Version: 1.0.11
 * Requires at least: 7.0
 * Requires PHP: 8.1
 * Author: Regionally Famous
 * Author URI: https://regionallyfamous.com
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: dewey
 * Domain Path: /languages
 *
 * @package Dewey
 */

defined( 'ABSPATH' ) || exit;

define( 'DEWEY_VERSION', '1.0.11' );
define( 'DEWEY_PLUGIN_FILE', __FILE__ );
define( 'DEWEY_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'DEWEY_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once DEWEY_PLUGIN_DIR . 'includes/class-dewey-settings.php';
require_once DEWEY_PLUGIN_DIR . 'includes/class-dewey-intent-router.php';
require_once DEWEY_PLUGIN_DIR . 'includes/class-dewey-indexer.php';
require_once DEWEY_PLUGIN_DIR . 'includes/class-dewey-engine.php';
require_once DEWEY_PLUGIN_DIR . 'includes/class-dewey-rest-controller.php';

/**
 * Register script and style handles for admin usage.
 *
 * @return void
 */
function dewey_register_assets() {
	$asset_path = DEWEY_PLUGIN_DIR . 'build/index.asset.php';
	$asset      = file_exists( $asset_path )
		? require $asset_path
		: array(
			'dependencies' => array( 'wp-element', 'wp-i18n' ),
			'version'      => DEWEY_VERSION,
		);
	$asset      = dewey_normalize_asset_meta( $asset );

	wp_register_script(
		'dewey-admin',
		DEWEY_PLUGIN_URL . 'build/index.js',
		$asset['dependencies'],
		$asset['version'],
		true
	);

	wp_register_style(
		'dewey-admin',
		DEWEY_PLUGIN_URL . 'build/index.css',
		array( 'wp-components' ),
		$asset['version']
	);
}
add_action( 'admin_init', 'dewey_register_assets' );

/**
 * Normalize asset metadata loaded from build/index.asset.php.
 *
 * @param mixed $asset Asset metadata payload.
 * @return array
 */
function dewey_normalize_asset_meta( $asset ) {
	$defaults = array(
		'dependencies' => array( 'wp-element', 'wp-i18n' ),
		'version'      => DEWEY_VERSION,
	);

	if ( ! is_array( $asset ) ) {
		return $defaults;
	}

	$deps = $asset['dependencies'] ?? $defaults['dependencies'];
	if ( ! is_array( $deps ) ) {
		$deps = $defaults['dependencies'];
	}

	$deps = array_values(
		array_filter(
			array_map(
				static function ( $value ) {
					if ( ! is_scalar( $value ) ) {
						return '';
					}

					return sanitize_key( (string) $value );
				},
				$deps
			)
		)
	);

	if ( empty( $deps ) ) {
		$deps = $defaults['dependencies'];
	}

	$version = $asset['version'] ?? $defaults['version'];
	if ( ! is_scalar( $version ) ) {
		$version = $defaults['version'];
	}

	return array(
		'dependencies' => $deps,
		'version'      => sanitize_text_field( (string) $version ),
	);
}

/**
 * Determine whether Dewey assets should load on the current admin page.
 *
 * @param string $hook_suffix Current admin hook suffix.
 * @return bool
 */
function dewey_should_enqueue_admin_assets( string $hook_suffix ): bool {
	if ( wp_doing_ajax() || wp_doing_cron() ) {
		return false;
	}

	if ( ! current_user_can( 'edit_posts' ) ) {
		return false;
	}

	$allowed_hooks = apply_filters(
		'dewey_allowed_admin_hooks',
		array(
			'index.php',
			'edit.php',
			'post.php',
			'post-new.php',
			'upload.php',
			'edit-tags.php',
			'term.php',
			'site-editor.php',
		)
	);
	$allowed_hooks = is_array( $allowed_hooks ) ? $allowed_hooks : array();

	$is_allowed_hook = in_array( $hook_suffix, $allowed_hooks, true );
	$is_allowed_hook = $is_allowed_hook || 0 === strpos( $hook_suffix, 'toplevel_page_' );
	$is_allowed_hook = $is_allowed_hook || 0 === strpos( $hook_suffix, 'dewey_page_' );
	$is_allowed_hook = $is_allowed_hook || 0 === strpos( $hook_suffix, 'settings_page_' );
	$is_allowed_hook = $is_allowed_hook || 0 === strpos( $hook_suffix, 'tools_page_' );

	if ( ! $is_allowed_hook ) {
		return false;
	}

	return (bool) apply_filters( 'dewey_can_enqueue_admin_assets', true );
}

/**
 * Load Dewey assets across wp-admin screens.
 *
 * @return void
 */
function dewey_enqueue_admin_assets( string $hook_suffix ) {
	if ( ! is_admin() ) {
		return;
	}
	if ( ! dewey_should_enqueue_admin_assets( $hook_suffix ) ) {
		return;
	}
	if ( ! wp_script_is( 'dewey-admin', 'registered' ) || ! wp_style_is( 'dewey-admin', 'registered' ) ) {
		return;
	}

	wp_enqueue_script( 'dewey-admin' );
	wp_enqueue_style( 'dewey-admin' );
	wp_set_script_translations(
		'dewey-admin',
		'dewey',
		DEWEY_PLUGIN_DIR . 'languages'
	);

	// wp_add_inline_script + wp_json_encode preserves PHP types (bool, int, etc.)
	// wp_localize_script must be avoided here because it coerces all values to
	// strings — PHP false becomes "" — which breaks truthiness checks in JS.
	wp_add_inline_script(
		'dewey-admin',
		'window.deweyConfig = ' . wp_json_encode(
			array(
				'restBase'      => esc_url_raw( rest_url( 'dewey/v1' ) ),
				'nonce'         => wp_create_nonce( 'wp_rest' ),
				'aiConnected'   => dewey_ai_connection_status(),
				'connectorsUrl' => esc_url_raw( dewey_get_connectors_admin_url() ),
			)
		) . ';',
		'before'
	);
}
add_action( 'admin_enqueue_scripts', 'dewey_enqueue_admin_assets' );
add_action( 'rest_api_init', array( 'Dewey_REST_Controller', 'register_routes' ) );

/**
 * Get the wp-admin URL for the Connectors screen.
 *
 * @return string
 */
function dewey_get_connectors_admin_url() {
	$url = apply_filters(
		'dewey_connectors_admin_url',
		admin_url( 'options-general.php?page=connectors-wp-admin' )
	);

	if ( ! is_string( $url ) || '' === trim( $url ) ) {
		return admin_url( 'options-general.php?page=connectors-wp-admin' );
	}

	return $url;
}

/**
 * Determine whether an AI provider is configured and ready.
 *
 * Uses connector option keys registered by core Connectors and keeps a
 * compatibility fallback for the earlier credentials array storage shape.
 *
 * The `dewey_ai_connected` filter can override the detected value when needed.
 *
 * @return bool
 */
function dewey_ai_connection_status() {
	$filter_override = apply_filters( 'dewey_ai_connected', null );
	if ( null !== $filter_override ) {
		return (bool) $filter_override;
	}

	$connector_option_keys = apply_filters(
		'dewey_connector_option_keys',
		array(
			'connectors_openai_api_key',
			'connectors_anthropic_api_key',
			'connectors_gemini_api_key',
		)
	);
	$connector_option_keys = is_array( $connector_option_keys ) ? $connector_option_keys : array();

	foreach ( $connector_option_keys as $option_key ) {
		if ( ! is_string( $option_key ) || '' === trim( $option_key ) ) {
			continue;
		}

		$value = get_option( $option_key, '' );
		if ( is_string( $value ) && '' !== trim( $value ) ) {
			return true;
		}
	}

	// Compatibility fallback for older option storage layouts.
	$credentials = get_option( 'wp_ai_client_provider_credentials', array() );

	if ( ! is_array( $credentials ) || empty( $credentials ) ) {
		return false;
	}

	return ! empty(
		array_filter(
			$credentials,
			static function ( $api_key ): bool {
				return is_string( $api_key ) && '' !== $api_key;
			}
		)
	);
}

/**
 * Register translations for the Dewey text domain.
 *
 * @return void
 */
function dewey_load_textdomain() {
	load_plugin_textdomain( 'dewey', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}
add_action( 'plugins_loaded', 'dewey_load_textdomain' );
