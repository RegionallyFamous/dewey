<?php
/**
 * Plugin Name: Dewey AI Search Assistant
 * Plugin URI: https://github.com/regionally-famous/dewey
 * Description: Dewey brings live archive query and AI answers into wp-admin, with citations and built-in guardrails powered by WordPress 7.0 core capabilities.
 * Version: 1.0.22
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

define( 'DEWEY_VERSION', '1.0.22' );
define( 'DEWEY_PLUGIN_FILE', __FILE__ );
define( 'DEWEY_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'DEWEY_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once DEWEY_PLUGIN_DIR . 'includes/class-dewey-settings.php';
require_once DEWEY_PLUGIN_DIR . 'includes/class-dewey-intent-router.php';
require_once DEWEY_PLUGIN_DIR . 'includes/class-dewey-action-handler.php';
require_once DEWEY_PLUGIN_DIR . 'includes/class-dewey-indexer.php';
require_once DEWEY_PLUGIN_DIR . 'includes/class-dewey-knowledge.php';
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
	$current_user = wp_get_current_user();
	wp_add_inline_script(
		'dewey-admin',
		'window.deweyConfig = ' . wp_json_encode(
			array(
				'restBase'      => esc_url_raw( rest_url( 'dewey/v1' ) ),
				'nonce'         => wp_create_nonce( 'wp_rest' ),
				'aiConnected'   => dewey_ai_connection_status(),
				'connectorsUrl' => esc_url_raw( dewey_get_connectors_admin_url() ),
				'debugEnabled'  => current_user_can( 'manage_options' ),
				'citationStyle' => (string) ( Dewey_Settings::get_all()['citation_style'] ?? 'titles' ),
				'currentUser'   => sanitize_text_field( (string) ( $current_user->display_name ?? '' ) ),
				'screenContext' => dewey_build_admin_screen_context(),
			)
		) . ';',
		'before'
	);
}
add_action( 'admin_enqueue_scripts', 'dewey_enqueue_admin_assets' );
add_action( 'rest_api_init', array( 'Dewey_REST_Controller', 'register_routes' ) );

/**
 * Build normalized wp-admin screen context for Dewey.
 *
 * This context is passed to the frontend and then to the REST query payload so
 * Dewey can reason about the current screen with structured signals.
 *
 * @return array<string,mixed>
 */
function dewey_build_admin_screen_context(): array {
	$context = array(
		'id'          => '',
		'base'        => '',
		'parent_base' => '',
		'post_type'   => '',
		'taxonomy'    => '',
		'title'       => '',
		'capabilities' => array(
			'edit_posts'     => current_user_can( 'edit_posts' ),
			'manage_options' => current_user_can( 'manage_options' ),
			'list_users'     => current_user_can( 'list_users' ),
		),
		'stats'       => array(),
	);

	if ( ! function_exists( 'get_current_screen' ) ) {
		return $context;
	}

	$screen = get_current_screen();
	if ( ! class_exists( 'WP_Screen' ) || ! $screen instanceof WP_Screen ) {
		return $context;
	}

	$context['id']          = sanitize_key( (string) $screen->id );
	$context['base']        = sanitize_key( (string) $screen->base );
	$context['parent_base'] = sanitize_key( (string) $screen->parent_base );
	$context['post_type']   = sanitize_key( (string) $screen->post_type );
	$context['taxonomy']    = sanitize_key( (string) $screen->taxonomy );

	if ( function_exists( 'get_admin_page_title' ) ) {
		$context['title'] = sanitize_text_field( (string) get_admin_page_title() );
	}

	$base = (string) $context['base'];
	if ( 0 === strpos( $base, 'settings_page' ) ) {
		$context['stats'] = array(
			'site_title'       => sanitize_text_field( (string) get_option( 'blogname', '' ) ),
			'timezone'         => sanitize_text_field( (string) get_option( 'timezone_string', '' ) ),
			'posts_per_page'   => (int) get_option( 'posts_per_page', 10 ),
			'default_category' => (int) get_option( 'default_category', 0 ),
		);
		return $context;
	}

	switch ( $base ) {
		case 'dashboard':
			$post_counts = wp_count_posts( 'post' );
			$context['stats'] = array(
				'published_posts' => isset( $post_counts->publish ) ? (int) $post_counts->publish : 0,
			);
			break;

		case 'plugins':
			if ( function_exists( 'get_plugins' ) ) {
				$plugins        = get_plugins();
				$active_plugins = (array) get_option( 'active_plugins', array() );
				$context['stats'] = array(
					'total_plugins'  => count( $plugins ),
					'active_plugins' => count( $active_plugins ),
				);
			}
			break;

		case 'themes':
			if ( function_exists( 'wp_get_themes' ) ) {
				$themes = wp_get_themes();
				$active = wp_get_theme();
				$context['stats'] = array(
					'total_themes' => is_array( $themes ) ? count( $themes ) : 0,
					'active_theme' => sanitize_text_field( (string) $active->get( 'Name' ) ),
				);
			}
			break;

		case 'users':
			if ( function_exists( 'count_users' ) ) {
				$users = count_users();
				$total = is_array( $users ) ? (int) ( $users['total_users'] ?? 0 ) : 0;
				$context['stats'] = array(
					'total_users' => $total,
				);
			}
			break;

		case 'upload':
			$attachment_counts = wp_count_posts( 'attachment' );
			$context['stats']  = array(
				'media_items' => isset( $attachment_counts->inherit ) ? (int) $attachment_counts->inherit : 0,
			);
			break;

		case 'edit':
		case 'post':
			$post_type = '' !== $context['post_type'] ? $context['post_type'] : 'post';
			$counts    = wp_count_posts( $post_type );
			$context['stats'] = array(
				'published' => isset( $counts->publish ) ? (int) $counts->publish : 0,
				'draft'     => isset( $counts->draft ) ? (int) $counts->draft : 0,
			);
			break;

		case 'options-general':
			$context['stats'] = array(
				'site_title'       => sanitize_text_field( (string) get_option( 'blogname', '' ) ),
				'timezone'         => sanitize_text_field( (string) get_option( 'timezone_string', '' ) ),
				'posts_per_page'   => (int) get_option( 'posts_per_page', 10 ),
				'default_category' => (int) get_option( 'default_category', 0 ),
			);
			break;
	}

	return $context;
}

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
 * Detect whether a value contains any non-empty scalar leaf.
 *
 * @param mixed $value Value to inspect recursively.
 * @return bool
 */
function dewey_has_non_empty_secret_value( $value ): bool {
	if ( is_string( $value ) ) {
		return '' !== trim( $value );
	}

	if ( is_numeric( $value ) ) {
		return '' !== trim( (string) $value );
	}

	if ( is_array( $value ) ) {
		foreach ( $value as $child ) {
			if ( dewey_has_non_empty_secret_value( $child ) ) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Build safe diagnostics for AI connection checks (no secrets exposed).
 *
 * @return array<string,mixed>
 */
function dewey_ai_connection_debug(): array {
	$connector_option_keys = apply_filters(
		'dewey_connector_option_keys',
		array(
			'connectors_ai_openai_api_key',
			'connectors_ai_anthropic_api_key',
			'connectors_ai_gemini_api_key',
			'connectors_ai_google_api_key',
			'connectors_openai_api_key',
			'connectors_anthropic_api_key',
			'connectors_gemini_api_key',
		)
	);
	$connector_option_keys = is_array( $connector_option_keys ) ? $connector_option_keys : array();
	$option_checks         = array();
	$detected_option_key   = '';

	foreach ( $connector_option_keys as $option_key ) {
		if ( ! is_string( $option_key ) || '' === trim( $option_key ) ) {
			continue;
		}

		$value        = get_option( $option_key, '' );
		$has_credential = dewey_has_non_empty_secret_value( $value );
		if ( '' === $detected_option_key && $has_credential ) {
			$detected_option_key = $option_key;
		}

		$option_checks[] = array(
			'key'            => $option_key,
			'type'           => gettype( $value ),
			'has_credential' => $has_credential,
		);
	}

	$credentials          = get_option( 'wp_ai_client_provider_credentials', array() );
	$legacy_has_any       = dewey_has_non_empty_secret_value( $credentials );
	$legacy_provider_keys = is_array( $credentials ) ? array_keys( $credentials ) : array();

	$core_helper_available = function_exists( 'wp_ai_has_connected_provider' );
	$core_helper_result    = null;
	$core_helper_error     = '';

	if ( $core_helper_available ) {
		try {
			$core_helper_result = (bool) wp_ai_has_connected_provider();
		} catch ( Throwable $e ) {
			$core_helper_error = sanitize_text_field( $e->getMessage() );
		}
	}

	return array(
		'checked_at'             => gmdate( 'c' ),
		'option_checks'          => $option_checks,
		'detected_option_key'    => $detected_option_key,
		'legacy_credentials_type' => gettype( $credentials ),
		'legacy_provider_keys'   => is_array( $legacy_provider_keys ) ? array_values( $legacy_provider_keys ) : array(),
		'legacy_has_any'         => $legacy_has_any,
		'core_helper_available'  => $core_helper_available,
		'core_helper_result'     => $core_helper_result,
		'core_helper_error'      => $core_helper_error,
	);
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

	$debug = dewey_ai_connection_debug();

	if ( true === ( $debug['core_helper_result'] ?? null ) ) {
		return true;
	}

	foreach ( $debug['option_checks'] as $check ) {
		if ( ! empty( $check['has_credential'] ) ) {
			return true;
		}
	}

	return ! empty( $debug['legacy_has_any'] );
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

// ---------------------------------------------------------------------------
// Auto-reindex on content changes
// ---------------------------------------------------------------------------

/**
 * Schedule a background reindex after a post is saved or deleted, with a
 * 60-second cooldown to prevent thrashing during bulk imports.
 *
 * @param int     $post_id
 * @param WP_Post $post
 * @param bool    $require_indexed_status Whether the post must currently be in
 *                                        an indexed status to schedule rebuild.
 * @return void
 */
function dewey_maybe_schedule_reindex( int $post_id, WP_Post $post, bool $require_indexed_status = true ): void {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	$settings   = Dewey_Settings::get_all();
	$post_types = is_array( $settings['indexed_post_types'] ?? null )
		? $settings['indexed_post_types']
		: array( 'post', 'page' );
	$statuses   = is_array( $settings['indexed_statuses'] ?? null )
		? $settings['indexed_statuses']
		: array( 'publish' );

	if ( ! in_array( $post->post_type, $post_types, true ) ) {
		return;
	}

	if ( $require_indexed_status && ! in_array( $post->post_status, $statuses, true ) ) {
		return;
	}

	// Cooldown: skip if a reindex completed or was scheduled within the last 60 seconds.
	$status      = Dewey_Indexer::status();
	$last_completed = (string) ( $status['last_completed'] ?? '' );
	if ( '' !== $last_completed ) {
		$elapsed = time() - (int) strtotime( $last_completed );
		if ( $elapsed < 60 ) {
			return;
		}
	}

	if ( ! wp_next_scheduled( 'dewey_scheduled_reindex' ) ) {
		wp_schedule_single_event( time() + 5, 'dewey_scheduled_reindex' );
	}
}
add_action(
	'save_post',
	static function ( int $post_id ) {
		$post = get_post( $post_id );
		if ( $post instanceof WP_Post ) {
			dewey_maybe_schedule_reindex( $post_id, $post );
		}
	}
);

/**
 * Reindex when a post transitions into or out of an indexed status.
 *
 * This keeps the index accurate when content is unpublished (e.g. publish ->
 * draft), where relying only on current status checks would leave stale hits.
 *
 * @param string  $new_status
 * @param string  $old_status
 * @param WP_Post $post
 * @return void
 */
add_action(
	'transition_post_status',
	static function ( string $new_status, string $old_status, WP_Post $post ) {
		$settings = Dewey_Settings::get_all();
		$statuses = is_array( $settings['indexed_statuses'] ?? null )
			? $settings['indexed_statuses']
			: array( 'publish' );
		if (
			! in_array( $old_status, $statuses, true ) &&
			! in_array( $new_status, $statuses, true )
		) {
			return;
		}

		dewey_maybe_schedule_reindex( (int) $post->ID, $post, false );
	},
	10,
	3
);

/**
 * Schedule a background reindex when a post is permanently deleted.
 *
 * @param int $post_id
 * @return void
 */
add_action(
	'delete_post',
	static function ( int $post_id ) {
		$post = get_post( $post_id );
		if ( $post instanceof WP_Post ) {
			// Deletions should always trigger index cleanup, even if current status
			// is no longer in the indexed allowlist.
			dewey_maybe_schedule_reindex( $post_id, $post, false );
		}
	}
);

/**
 * WP-Cron callback to run the Dewey index rebuild in the background.
 *
 * @return void
 */
function dewey_run_scheduled_reindex(): void {
	if ( ! class_exists( 'Dewey_Indexer' ) ) {
		return;
	}

	Dewey_Indexer::rebuild();
}
add_action( 'dewey_scheduled_reindex', 'dewey_run_scheduled_reindex' );
