<?php
/**
 * Dewey_Intent_Router
 *
 * Lightweight intent parser for settings-by-chat.
 *
 * @package Dewey
 */

defined( 'ABSPATH' ) || exit;

class Dewey_Intent_Router {

	/**
	 * @param string $question
	 * @return array
	 */
	public function route( string $question ): array {
		$q = strtolower( trim( $question ) );
		foreach ( $this->rules() as $rule ) {
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
	 * Ordered intent match rules.
	 *
	 * @return array
	 */
	private function rules(): array {
		return array(
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
