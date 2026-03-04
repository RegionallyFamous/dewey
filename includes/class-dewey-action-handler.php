<?php
declare(strict_types=1);
/**
 * Dewey_Action_Handler
 *
 * Executes content write actions (create/list/trash/publish) on behalf of the
 * logged-in user. Every method enforces WordPress capability checks before
 * touching the database — Dewey can never do more than the current user can.
 *
 * @package Dewey
 */

defined( 'ABSPATH' ) || exit;

final class Dewey_Action_Handler {

	const ALLOWED_POST_TYPES  = array( 'post', 'page' );
	const MAX_LIST_COUNT      = 10;
	const MAX_TITLE_LENGTH    = 200;
	const SEARCH_TERM_MAX_LEN = 120;

	// -------------------------------------------------------------------------
	// Public API
	// -------------------------------------------------------------------------

	/**
	 * Create a new post or page as a draft.
	 *
	 * Always creates in draft status — publishing requires a separate confirm.
	 *
	 * @param array<string,mixed> $params title, post_type, content (optional).
	 * @return array<string,mixed>|WP_Error
	 */
	public static function create_post( array $params ) {
		$post_type = self::resolve_post_type( (string) ( $params['post_type'] ?? 'post' ) );

		$cap = 'page' === $post_type ? 'edit_pages' : 'edit_posts';
		if ( ! current_user_can( $cap ) ) {
			return new WP_Error(
				'dewey_forbidden',
				/* translators: %s: post type label */
				sprintf( __( 'You do not have permission to create %s.', 'dewey' ), $post_type . 's' ),
				array( 'status' => 403 )
			);
		}

		$title = self::sanitize_title( (string) ( $params['title'] ?? '' ) );
		if ( '' === $title ) {
			return new WP_Error(
				'dewey_invalid_params',
				__( 'A title is required to create content.', 'dewey' ),
				array( 'status' => 400 )
			);
		}

		$content = wp_kses_post( (string) ( $params['content'] ?? '' ) );

		$post_id = wp_insert_post(
			array(
				'post_title'   => $title,
				'post_content' => $content,
				'post_type'    => $post_type,
				'post_status'  => 'draft',
				'post_author'  => get_current_user_id(),
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		return array(
			'post_id'   => (int) $post_id,
			'title'     => $title,
			'post_type' => $post_type,
			'status'    => 'draft',
			'edit_url'  => (string) ( get_edit_post_link( $post_id, 'raw' ) ?: '' ),
		);
	}

	/**
	 * Return a list of recent posts/pages matching the given criteria.
	 *
	 * Only shows posts the current user can edit. Enforces edit_others_posts
	 * before surfacing other authors' content.
	 *
	 * @param array<string,mixed> $params status, post_type, count.
	 * @return array<string,mixed>|WP_Error
	 */
	public static function list_posts( array $params ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'dewey_forbidden',
				__( 'You do not have permission to list posts.', 'dewey' ),
				array( 'status' => 403 )
			);
		}

		$post_type = self::resolve_post_type( (string) ( $params['post_type'] ?? 'post' ) );
		$status    = self::resolve_list_status( (string) ( $params['status'] ?? 'any' ) );
		$count     = min( absint( $params['count'] ?? 5 ), self::MAX_LIST_COUNT );
		if ( $count < 1 ) {
			$count = 5;
		}

		$query_args = array(
			'post_type'              => $post_type,
			'post_status'            => $status,
			'posts_per_page'         => $count,
			'orderby'                => 'modified',
			'order'                  => 'DESC',
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		);

		// Non-admins only see their own unpublished content.
		if (
			! current_user_can( 'edit_others_posts' ) &&
			'publish' !== $status && 'any' !== $status
		) {
			$query_args['author'] = get_current_user_id();
		}

		$query = new WP_Query( $query_args );
		$posts = array();

		foreach ( $query->posts as $post ) {
			if ( ! ( $post instanceof WP_Post ) ) {
				continue;
			}
			if ( ! current_user_can( 'edit_post', $post->ID ) ) {
				continue;
			}
			$posts[] = array(
				'post_id'  => $post->ID,
				'title'    => (string) get_the_title( $post ),
				'status'   => $post->post_status,
				'modified' => $post->post_modified,
				'edit_url' => (string) ( get_edit_post_link( $post->ID, 'raw' ) ?: '' ),
			);
		}

		return array(
			'posts'     => $posts,
			'total'     => count( $posts ),
			'status'    => $status,
			'post_type' => $post_type,
		);
	}

	/**
	 * Move a post to trash.
	 *
	 * Requires confirmation before calling (destructive). The caller is
	 * responsible for verifying a signed token before invoking this method.
	 *
	 * @param array<string,mixed> $params post_id.
	 * @return array<string,mixed>|WP_Error
	 */
	public static function trash_post( array $params ) {
		$post_id = absint( $params['post_id'] ?? 0 );
		if ( $post_id <= 0 ) {
			return new WP_Error( 'dewey_invalid_params', __( 'Invalid post ID.', 'dewey' ), array( 'status' => 400 ) );
		}

		$post = get_post( $post_id );
		if ( ! ( $post instanceof WP_Post ) || 'trash' === $post->post_status ) {
			return new WP_Error(
				'dewey_not_found',
				__( 'Post not found or already in trash.', 'dewey' ),
				array( 'status' => 404 )
			);
		}

		if ( ! current_user_can( 'delete_post', $post_id ) ) {
			return new WP_Error(
				'dewey_forbidden',
				__( 'You do not have permission to delete this post.', 'dewey' ),
				array( 'status' => 403 )
			);
		}

		$result = wp_trash_post( $post_id );
		if ( false === $result ) {
			return new WP_Error(
				'dewey_action_failed',
				__( 'Could not move post to trash.', 'dewey' ),
				array( 'status' => 500 )
			);
		}

		return array(
			'post_id' => $post_id,
			'title'   => (string) get_the_title( $post ),
			'status'  => 'trash',
		);
	}

	/**
	 * Publish a draft/pending post.
	 *
	 * Requires confirmation before calling (destructive). The caller is
	 * responsible for verifying a signed token before invoking this method.
	 *
	 * @param array<string,mixed> $params post_id.
	 * @return array<string,mixed>|WP_Error
	 */
	public static function publish_post( array $params ) {
		$post_id = absint( $params['post_id'] ?? 0 );
		if ( $post_id <= 0 ) {
			return new WP_Error( 'dewey_invalid_params', __( 'Invalid post ID.', 'dewey' ), array( 'status' => 400 ) );
		}

		$post = get_post( $post_id );
		if ( ! ( $post instanceof WP_Post ) ) {
			return new WP_Error( 'dewey_not_found', __( 'Post not found.', 'dewey' ), array( 'status' => 404 ) );
		}

		if ( 'publish' === $post->post_status ) {
			return new WP_Error(
				'dewey_already_done',
				sprintf(
					/* translators: %s: post title */
					__( '"%s" is already published.', 'dewey' ),
					get_the_title( $post )
				),
				array( 'status' => 409 )
			);
		}

		if ( ! current_user_can( 'edit_post', $post_id ) || ! current_user_can( 'publish_posts' ) ) {
			return new WP_Error(
				'dewey_forbidden',
				__( 'You do not have permission to publish this post.', 'dewey' ),
				array( 'status' => 403 )
			);
		}

		$result = wp_update_post(
			array(
				'ID'          => $post_id,
				'post_status' => 'publish',
			),
			true
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return array(
			'post_id'   => $post_id,
			'title'     => (string) get_the_title( $post ),
			'status'    => 'publish',
			'permalink' => (string) ( get_permalink( $post_id ) ?: '' ),
			'edit_url'  => (string) ( get_edit_post_link( $post_id, 'raw' ) ?: '' ),
		);
	}

	/**
	 * Find a single post matching a search term.
	 *
	 * Tries exact title first, then falls back to a full-text search. Returns
	 * null if nothing matches, so callers can respond with "I couldn't find…".
	 *
	 * @param string   $term       Search term from the user's question.
	 * @param string[] $post_types Limit to these post types.
	 * @return WP_Post|null
	 */
	public static function find_by_term( string $term, array $post_types = array( 'post', 'page' ) ): ?WP_Post {
		$term = sanitize_text_field( mb_substr( trim( $term ), 0, self::SEARCH_TERM_MAX_LEN ) );
		if ( '' === $term ) {
			return null;
		}

		$post_types = array_values(
			array_filter( $post_types, fn( $pt ) => in_array( $pt, self::ALLOWED_POST_TYPES, true ) )
		);
		if ( empty( $post_types ) ) {
			$post_types = array( 'post' );
		}

		$statuses = array( 'publish', 'draft', 'pending', 'private', 'future' );

		// Title-first lookup (WP 4.4+ 'title' param does a LIKE match).
		$title_query = new WP_Query(
			array(
				'post_type'              => $post_types,
				'post_status'            => $statuses,
				'title'                  => $term,
				'posts_per_page'         => 3,
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);

		if ( $title_query->have_posts() && ! empty( $title_query->posts ) ) {
			$first = $title_query->posts[0];
			if ( $first instanceof WP_Post && current_user_can( 'edit_post', $first->ID ) ) {
				return $first;
			}
		}

		// Full-text fallback.
		$search_query = new WP_Query(
			array(
				'post_type'              => $post_types,
				'post_status'            => $statuses,
				's'                      => $term,
				'posts_per_page'         => 1,
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);

		if ( $search_query->have_posts() && ! empty( $search_query->posts ) ) {
			$first = $search_query->posts[0];
			if ( $first instanceof WP_Post && current_user_can( 'edit_post', $first->ID ) ) {
				return $first;
			}
		}

		return null;
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	/**
	 * @param string $raw
	 * @return string
	 */
	private static function resolve_post_type( string $raw ): string {
		return in_array( $raw, self::ALLOWED_POST_TYPES, true ) ? $raw : 'post';
	}

	/**
	 * Resolve and validate a list status. Returns 'any' for unknown values.
	 *
	 * @param string $raw
	 * @return string
	 */
	private static function resolve_list_status( string $raw ): string {
		$allowed = array( 'publish', 'draft', 'pending', 'private', 'future', 'any' );
		return in_array( $raw, $allowed, true ) ? $raw : 'any';
	}

	/**
	 * @param string $raw
	 * @return string
	 */
	private static function sanitize_title( string $raw ): string {
		$clean = wp_strip_all_tags( trim( $raw ) );
		return (string) mb_substr( $clean, 0, self::MAX_TITLE_LENGTH );
	}
}
