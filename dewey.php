<?php
/**
 * Plugin Name: Dewey AI Search Assistant
 * Plugin URI: https://github.com/regionally-famous/dewey
 * Description: Your best content is already written. Dewey helps your team rediscover it instantly in wp-admin, so every post is faster, sharper, and source-backed.
 * Version: 1.0.9
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

define( 'DEWEY_VERSION', '1.0.9' );
define( 'DEWEY_PLUGIN_FILE', __FILE__ );
define( 'DEWEY_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'DEWEY_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once DEWEY_PLUGIN_DIR . 'includes/class-dewey-settings.php';
require_once DEWEY_PLUGIN_DIR . 'includes/class-dewey-intent-router.php';

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
			'dependencies' => array( 'wp-element' ),
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
		'dependencies' => array( 'wp-element' ),
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

	wp_localize_script(
		'dewey-admin',
		'deweyConfig',
		array(
			'restBase'     => esc_url_raw( rest_url( 'dewey/v1' ) ),
			'nonce'        => wp_create_nonce( 'wp_rest' ),
			'aiConnected'  => dewey_ai_connection_status(),
		)
	);
}
add_action( 'admin_enqueue_scripts', 'dewey_enqueue_admin_assets' );

/**
 * Best-effort AI connector status.
 *
 * NOTE: We intentionally avoid direct calls into the WordPress AI Client
 * helper functions here because current WP/AI-client combinations can trigger
 * class/interface signature fatals during lazy loading in some environments.
 *
 * Integrations can still provide a reliable status via the dewey_ai_connected
 * filter without risking hard fatals in wp-admin.
 *
 * @return bool
 */
function dewey_ai_connection_status() {
	return (bool) apply_filters( 'dewey_ai_connected', false );
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
