/**
 * copy.js
 *
 * Canonical Dewey voice strings and starter prompts.
 */

export const STORAGE_KEYS = {
	openedOnce: 'dewey.hasOpenedOnce',
};

export const STARTER_ACTIONS = [
	{
		id: 'what-can-you-do',
		label: 'What can you do?',
		reply: "I am your archive guide. I can comb through your posts, pull the strongest matches, and answer with source-backed context so you're never guessing.",
	},
	{
		id: 'how-does-this-work',
		label: 'How does this work?',
		reply: 'Ask in plain language, like you would ask a teammate. I search your archive first, then shape a clear answer and point you to the posts it came from.',
	},
	{
		id: 'what-should-i-ask',
		label: 'What should I ask?',
		reply: 'Try prompts like: "What have I written about onboarding?" or "Summarize my best advice for first-time founders." Specific questions get better answers.',
	},
];

export const FIRST_OPEN_MESSAGE =
	'Hello, I am Dewey. I help you rediscover what your site already knows: answers from your own archive, with sources you can verify.';

export const NO_AI_MESSAGE =
	'I can still answer startup questions, but for full archive answers I need an AI service connected first. Open Settings -> AI -> Connectors, connect a provider, then come right back and I will take it from there.';

export const CONNECTED_PLACEHOLDER_MESSAGE =
	'I am connected and ready. Live archive querying is not wired in this build yet, but your connection is set and I can answer startup guidance.';

export function getSpeechText( deweyState, isAiConnected ) {
	if ( deweyState === 'hello' ) {
		return 'Hey there. Need the quick tour?';
	}
	if ( deweyState === 'sad' && ! isAiConnected ) {
		return 'I need an AI connection for full answers.';
	}
	return 'Ask me about your archive.';
}
