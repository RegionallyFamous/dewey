/**
 * copy.js
 *
 * Canonical Dewey voice strings and starter prompts.
 */

import { __ } from '@wordpress/i18n';

export const STORAGE_KEYS = {
	openedOnce: 'dewey.hasOpenedOnce',
};

export const STARTER_ACTIONS = [
	{
		id: 'what-can-you-do',
		label: __( 'What can you do?', 'dewey' ),
		reply: __(
			"Good question. I can search your archive and pull up anything you need — posts, pages, content patterns. I can also answer general WordPress questions, help you think through editorial decisions, and act on settings when you ask. Just talk to me like a teammate.",
			'dewey'
		),
	},
	{
		id: 'how-does-this-work',
		label: __( 'How does this work?', 'dewey' ),
		reply: __(
			"Type anything. If it's in your archive, I'll find it and give you a real answer with sources. If it's not, I'll use my own knowledge. Either way, you get an answer — not a search results page.",
			'dewey'
		),
	},
];

export const FIRST_OPEN_MESSAGE = __(
	"Hey, I'm Dewey. Ask me anything about your site or WordPress — I'll search your archive or answer from my own knowledge.",
	'dewey'
);

export const NO_AI_MESSAGE = __(
	"I need an AI provider connected to answer that. Head to Settings → Connectors, add a key, then come back — I'll be ready.",
	'dewey'
);

export const CONNECTED_PLACEHOLDER_MESSAGE = __(
	"Connected and ready. What do you need?",
	'dewey'
);

export function getSpeechText( deweyState, isAiConnected ) {
	if ( deweyState === 'hello' ) {
		return __( 'Hey — what do you need?', 'dewey' );
	}
	if ( deweyState === 'sad' && ! isAiConnected ) {
		return __( 'Connect an AI provider to get started.', 'dewey' );
	}
	return __( 'Ask me anything.', 'dewey' );
}
