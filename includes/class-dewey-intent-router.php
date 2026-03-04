<?php
declare(strict_types=1);
/**
 * Dewey_Intent_Router
 *
 * Lightweight intent parser for settings-by-chat.
 *
 * @package Dewey
 */

defined( 'ABSPATH' ) || exit;

final class Dewey_Intent_Router {

	/**
	 * Action intent rules checked before settings rules.
	 *
	 * Each rule returns type:'action' with action_type, optional capture fields,
	 * and whether the action needs user confirmation.
	 *
	 * @var array<int,array{
	 *   pattern:string,
	 *   action_type:string,
	 *   post_type:string,
	 *   status:string,
	 *   requires_confirm:bool,
	 *   confidence:float
	 * }>
	 */
	private const ACTION_RULES = array(
		// Create post ---------------------------------------------------------
		array(
			'pattern'          => '/\b(?:create|write|draft|start|add)\b.{0,20}\b(?:post|article|blog\s*post)\b.{0,60}\b(?:about|called|titled|named|on)\b\s+(.+)/i',
			'action_type'      => 'create_post',
			'post_type'        => 'post',
			'status'           => '',
			'requires_confirm' => false,
			'confidence'       => 0.92,
		),
		array(
			'pattern'          => '/\b(?:create|write|draft|start|add)\b\s+(?:a\s+)?(?:new\s+)?(?:post|article|blog\s*post)\b(.+)?/i',
			'action_type'      => 'create_post',
			'post_type'        => 'post',
			'status'           => '',
			'requires_confirm' => false,
			'confidence'       => 0.88,
		),
		// Create page ---------------------------------------------------------
		array(
			'pattern'          => '/\b(?:create|add|make|start)\b.{0,20}\bpage\b.{0,60}\b(?:about|called|titled|named|for)\b\s+(.+)/i',
			'action_type'      => 'create_post',
			'post_type'        => 'page',
			'status'           => '',
			'requires_confirm' => false,
			'confidence'       => 0.92,
		),
		array(
			'pattern'          => '/\b(?:create|add|make|start)\b\s+(?:a\s+)?(?:new\s+)?page\b(.+)?/i',
			'action_type'      => 'create_post',
			'post_type'        => 'page',
			'status'           => '',
			'requires_confirm' => false,
			'confidence'       => 0.88,
		),
		// List drafts ---------------------------------------------------------
		array(
			'pattern'          => '/\b(?:show|list|view|find|see)\b.{0,20}\b(?:my\s+)?(?:all\s+|recent\s+|latest\s+)?drafts?\b/i',
			'action_type'      => 'list_posts',
			'post_type'        => 'post',
			'status'           => 'draft',
			'requires_confirm' => false,
			'confidence'       => 0.93,
		),
		// List published posts ------------------------------------------------
		array(
			'pattern'          => '/\b(?:show|list|view)\b.{0,20}\b(?:my\s+)?(?:all\s+|recent\s+|latest\s+)?(?:published\s+)?posts?\b/i',
			'action_type'      => 'list_posts',
			'post_type'        => 'post',
			'status'           => 'publish',
			'requires_confirm' => false,
			'confidence'       => 0.88,
		),
		// List pages ----------------------------------------------------------
		array(
			'pattern'          => '/\b(?:show|list|view)\b.{0,20}\b(?:my\s+)?(?:all\s+|recent\s+)?pages?\b/i',
			'action_type'      => 'list_posts',
			'post_type'        => 'page',
			'status'           => 'any',
			'requires_confirm' => false,
			'confidence'       => 0.88,
		),
		// Trash post ----------------------------------------------------------
		array(
			'pattern'          => '/\b(?:trash|delete|remove)\b.{0,20}\b(?:the\s+)?(?:post|page|article|draft)?\b.{0,40}\b(?:about|called|titled|named)\b\s+(.+)/i',
			'action_type'      => 'trash_post',
			'post_type'        => '',
			'status'           => '',
			'requires_confirm' => true,
			'confidence'       => 0.90,
		),
		array(
			'pattern'          => '/\b(?:trash|delete|remove)\b\s+(?:the\s+)?(?:post|page|article|draft)\b\s+(.+)/i',
			'action_type'      => 'trash_post',
			'post_type'        => '',
			'status'           => '',
			'requires_confirm' => true,
			'confidence'       => 0.88,
		),
		// Publish post --------------------------------------------------------
		array(
			'pattern'          => '/\b(?:publish|go\s+live\s+with|make\s+live|release)\b.{0,20}\b(?:the\s+)?(?:post|page|article|draft)?\b.{0,40}\b(?:about|called|titled|named)\b\s+(.+)/i',
			'action_type'      => 'publish_post',
			'post_type'        => '',
			'status'           => '',
			'requires_confirm' => true,
			'confidence'       => 0.90,
		),
		array(
			'pattern'          => '/\b(?:publish|go\s+live\s+with|make\s+live|release)\b\s+(?:the\s+)?(?:post|page|article|draft)\b\s+(.+)/i',
			'action_type'      => 'publish_post',
			'post_type'        => '',
			'status'           => '',
			'requires_confirm' => true,
			'confidence'       => 0.88,
		),
	);

	/**
	 * Ordered match rules, evaluated top-to-bottom.
	 *
	 * @var array<int,array{
	 *   pattern:string,
	 *   action:string,
	 *   params:array<string,mixed>,
	 *   requires_confirm:bool,
	 *   user_facing_action:string,
	 *   confidence:float
	 * }>
	 */
	private const RULES = array(
		array(
			'pattern'            => '/\b(reindex|re-index|rebuild)\b.*\b(index|archive)\b|\brun\b.*\breindex\b/',
			'action'             => 'reindex_now',
			'params'             => array(),
			'requires_confirm'   => true,
			'user_facing_action' => 'Run full index rebuild now',
			'confidence'         => 0.98,
		),
		array(
			'pattern'            => '/\b(use|set|switch).*\b(core|wp query|wp_query|wordpress core)\b/',
			'action'             => 'set_settings',
			'params'             => array( 'retrieval_mode' => 'core' ),
			'requires_confirm'   => false,
			'user_facing_action' => 'Use core retrieval backend',
			'confidence'         => 0.95,
		),
		array(
			'pattern'            => '/\b(use|set|switch).*\b(indexed|index table|fulltext)\b/',
			'action'             => 'set_settings',
			'params'             => array( 'retrieval_mode' => 'indexed' ),
			'requires_confirm'   => true,
			'user_facing_action' => 'Use indexed retrieval backend',
			'confidence'         => 0.95,
		),
		array(
			'pattern'            => '/\b(auto|automatic)\b.*\b(retrieval|backend)\b/',
			'action'             => 'set_settings',
			'params'             => array( 'retrieval_mode' => 'auto' ),
			'requires_confirm'   => false,
			'user_facing_action' => 'Use automatic retrieval backend selection',
			'confidence'         => 0.95,
		),
		array(
			'pattern'            => '/\b(minimize|reduce|lower|save)\b.*\b(cost|token|tokens|spend|money)\b/',
			'action'             => 'set_settings',
			'params'             => array( 'cost_mode' => 'minimize' ),
			'requires_confirm'   => false,
			'user_facing_action' => 'Enable token cost minimization mode',
			'confidence'         => 0.95,
		),
		array(
			'pattern'            => '/\b(balanced|quality)\b.*\b(mode|cost|tokens?)\b|\bmore detail\b.*\bcost\b/',
			'action'             => 'set_settings',
			'params'             => array( 'cost_mode' => 'balanced' ),
			'requires_confirm'   => false,
			'user_facing_action' => 'Enable balanced cost mode',
			'confidence'         => 0.95,
		),
		array(
			'pattern'            => '/\b(be|answer)\b.*\b(concise|short|shorter)\b/',
			'action'             => 'set_settings',
			'params'             => array( 'assistant_verbosity' => 'concise' ),
			'requires_confirm'   => false,
			'user_facing_action' => 'Set assistant verbosity to concise',
			'confidence'         => 0.95,
		),
		array(
			'pattern'            => '/\b(be|answer)\b.*\b(detailed|longer|verbose)\b/',
			'action'             => 'set_settings',
			'params'             => array( 'assistant_verbosity' => 'detailed' ),
			'requires_confirm'   => false,
			'user_facing_action' => 'Set assistant verbosity to detailed',
			'confidence'         => 0.95,
		),
		array(
			'pattern'            => '/\btone\b.*\b(casual)\b/',
			'action'             => 'set_settings',
			'params'             => array( 'assistant_tone' => 'casual' ),
			'requires_confirm'   => false,
			'user_facing_action' => 'Set assistant tone to casual',
			'confidence'         => 0.95,
		),
		array(
			'pattern'            => '/\btone\b.*\b(precise|formal)\b/',
			'action'             => 'set_settings',
			'params'             => array( 'assistant_tone' => 'precise' ),
			'requires_confirm'   => false,
			'user_facing_action' => 'Set assistant tone to precise',
			'confidence'         => 0.95,
		),
		array(
			'pattern'            => '/\bindex only posts?\b/',
			'action'             => 'set_settings',
			'params'             => array( 'indexed_post_types' => array( 'post' ) ),
			'requires_confirm'   => true,
			'user_facing_action' => 'Index only posts',
			'confidence'         => 0.95,
		),
		array(
			'pattern'            => '/\bindex only pages?\b/',
			'action'             => 'set_settings',
			'params'             => array( 'indexed_post_types' => array( 'page' ) ),
			'requires_confirm'   => true,
			'user_facing_action' => 'Index only pages',
			'confidence'         => 0.95,
		),
		array(
			'pattern'            => '/\b(include|index|search)\b.*\b(drafts?|private posts?|unpublished)\b/',
			'action'             => 'set_settings',
			'params'             => array(
				'allow_nonpublic_indexing' => true,
				'indexed_statuses'         => array( 'publish', 'draft', 'private' ),
			),
			'requires_confirm'   => true,
			'user_facing_action' => 'Include drafts/private content in Dewey indexing',
			'confidence'         => 0.96,
		),
		array(
			'pattern'            => '/\b(disable|turn off|stop|exclude)\b.*\b(drafts?|private posts?|unpublished)\b/',
			'action'             => 'set_settings',
			'params'             => array(
				'allow_nonpublic_indexing' => false,
				'indexed_statuses'         => array( 'publish' ),
			),
			'requires_confirm'   => true,
			'user_facing_action' => 'Restrict Dewey indexing to published content only',
			'confidence'         => 0.96,
		),
	);

	/**
	 * @param string $question
	 * @return array
	 */
	public function route( string $question ): array {
		$q = strtolower( trim( $question ) );

		// Check action intents first — they are more specific than settings.
		foreach ( self::ACTION_RULES as $rule ) {
			$matched = preg_match( $rule['pattern'], $q, $matches );
			if ( ! $matched ) {
				continue;
			}
			// Capture group 1, if present, is the title/search term.
			$capture = isset( $matches[1] ) ? trim( $matches[1] ) : '';
			return $this->action_intent( $rule, $capture );
		}

		foreach ( self::RULES as $rule ) {
			if ( ! preg_match( $rule['pattern'], $q ) ) {
				continue;
			}
			return $this->settings_intent(
				$rule['action'],
				$rule['params'],
				$rule['requires_confirm'],
				$rule['user_facing_action'],
				$rule['confidence']
			);
		}

		return array(
			'type'       => 'archive',
			'confidence' => 0.5,
		);
	}

	/**
	 * Build an action intent array from a matched ACTION_RULE.
	 *
	 * @param array  $rule    Matched rule from ACTION_RULES.
	 * @param string $capture Regex capture group (title or search term).
	 * @return array
	 */
	private function action_intent( array $rule, string $capture ): array {
		return array(
			'type'             => 'action',
			'action_type'      => (string) ( $rule['action_type'] ?? '' ),
			'post_type'        => (string) ( $rule['post_type'] ?? 'post' ),
			'status'           => (string) ( $rule['status'] ?? '' ),
			'search_term'      => sanitize_text_field( $capture ),
			'requires_confirm' => (bool) ( $rule['requires_confirm'] ?? false ),
			'confidence'       => (float) ( $rule['confidence'] ?? 0.88 ),
		);
	}

	/**
	 * @param string $action
	 * @param array  $params
	 * @param bool   $requires_confirm
	 * @param string $user_action
	 * @param float  $confidence
	 * @return array
	 */
	private function settings_intent( string $action, array $params, bool $requires_confirm, string $user_action, float $confidence = 0.95 ): array {
		return array(
			'type'               => 'settings',
			'action'             => $action,
			'params'             => $params,
			'requires_confirm'   => $requires_confirm,
			'confidence'         => $confidence,
			'user_facing_action' => $user_action,
		);
	}
}
