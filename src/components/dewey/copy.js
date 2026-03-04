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
			'I help your team get oriented quickly with guided prompts, workflow support, and AI connection readiness for full archive answers.',
			'dewey'
		),
	},
	{
		id: 'how-does-this-work',
		label: __( 'How does this work?', 'dewey' ),
		reply: __(
			'Ask in plain language, like you would ask a teammate. In this build I provide startup guidance and connection checks while live archive answers are being finalized.',
			'dewey'
		),
	},
];

export const FIRST_OPEN_MESSAGE = __(
	'Hello, I am Dewey. I am your in-admin editorial guide for faster decisions, clearer direction, and AI-ready archive workflows.',
	'dewey'
);

export const NO_AI_MESSAGE = __(
	'I can still answer startup questions, but for full archive answers I need an AI service connected first. Open Settings -> Connectors, connect a provider, then come right back and I will take it from there.',
	'dewey'
);

export const CONNECTED_PLACEHOLDER_MESSAGE = __(
	'I am connected and ready to query your archive.',
	'dewey'
);

export function getSpeechText( deweyState, isAiConnected ) {
	if ( deweyState === 'hello' ) {
		return __( 'Hey there. Need the quick tour?', 'dewey' );
	}
	if ( deweyState === 'sad' && ! isAiConnected ) {
		return __( 'I need an AI connection for full answers.', 'dewey' );
	}
	return __( 'Ask me about your archive.', 'dewey' );
}
