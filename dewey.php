<?php
/**
 * Plugin Name: Dewey
 * Plugin URI: https://github.com/regionally-famous/dewey
 * Description: Turn years of posts into instant, source-backed answers inside WP Admin.
 * Version: 1.0.6
 * Requires at least: 7.0
 * Requires PHP: 7.4
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

define( 'DEWEY_VERSION', '1.0.6' );
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
		array(),
		$asset['version']
	);
}
add_action( 'admin_init', 'dewey_register_assets' );

/**
 * Determine whether Dewey assets should load on the current admin page.
 *
 * @param string $hook_suffix Current admin hook suffix.
 * @return bool
 */
function dewey_should_enqueue_admin_assets( string $hook_suffix ): bool {
	unset( $hook_suffix );

	if ( ! current_user_can( 'edit_posts' ) ) {
		return false;
	}

	return true;
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
