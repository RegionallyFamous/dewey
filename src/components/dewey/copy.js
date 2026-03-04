/**
 * copy.js
 *
 * Canonical Dewey voice strings and starter prompts.
 */

import { __ } from '@wordpress/i18n';

export const STORAGE_KEYS = {
	openedOnce: 'dewey.hasOpenedOnce',
	messages: 'dewey.messages',
};

export const STARTER_ACTIONS = [
	{
		id: 'what-can-you-do',
		label: __( 'What can you do?', 'dewey' ),
		reply: __(
			"I've read every post, draft, revision, and taxonomy choice this site has ever made. Ask me for a post, a pattern, a summary, or a mystery. I find things, connect dots, and I have opinions about metadata.",
			'dewey'
		),
	},
	{
		id: 'how-does-this-work',
		label: __( 'How does this work?', 'dewey' ),
		reply: __(
			'You ask. I search your archive first, then surface what matters with source context. If something is missing, I do not shrug. I investigate.',
			'dewey'
		),
	},
	{
		id: 'what-should-i-ask',
		label: __( 'What should I ask first?', 'dewey' ),
		reply: __(
			'Try: "What have we published about onboarding since 2022?" or "Which posts mention pricing but never mention retention?" Specific questions make me insufferably effective.',
			'dewey'
		),
	},
];

/**
 * Proactive page-aware hints keyed by window.pagenow slug.
 * hint: short text appended to the greeting.
 * actions: followup-kind chips surfaced as the welcome message actions.
 */
export const PAGE_CONTEXT_HINTS = {
	edit: {
		hint: __( "You're looking at your posts.", 'dewey' ),
		actions: [
			{
				id: 'page-gaps',
				kind: 'followup',
				label: __( 'Find content gaps', 'dewey' ),
				question: __(
					'What topics am I missing coverage on based on what I already have published?',
					'dewey'
				),
			},
			{
				id: 'page-audit',
				kind: 'followup',
				label: __( 'Quick content audit', 'dewey' ),
				question: __(
					'Give me a quick audit of my recent posts — strengths, weaknesses, patterns.',
					'dewey'
				),
			},
		],
	},
	'edit-pages': {
		hint: __( "You're on your Pages.", 'dewey' ),
		actions: [
			{
				id: 'page-structure',
				kind: 'followup',
				label: __( 'Review page structure', 'dewey' ),
				question: __(
					'How well-organized are my pages? Any obvious gaps or redundancy?',
					'dewey'
				),
			},
		],
	},
	post: {
		hint: __( "You're in the editor.", 'dewey' ),
		actions: [
			{
				id: 'post-overlap',
				kind: 'followup',
				label: __( 'Check for overlap', 'dewey' ),
				question: __(
					'What have I already published on this topic? Am I covering something new?',
					'dewey'
				),
			},
			{
				id: 'post-ideas',
				kind: 'followup',
				label: __( 'Related post ideas', 'dewey' ),
				question: __(
					'Based on my existing content, what related posts would complement what I write next?',
					'dewey'
				),
			},
		],
	},
	'post-new': {
		hint: __( 'Starting something new.', 'dewey' ),
		actions: [
			{
				id: 'new-ideas',
				kind: 'followup',
				label: __( 'What should I write?', 'dewey' ),
				question: __(
					'Based on my existing content, what topic would be most valuable to publish next?',
					'dewey'
				),
			},
		],
	},
	upload: {
		hint: __( "You're in the Media Library.", 'dewey' ),
		actions: [
			{
				id: 'media-summary',
				kind: 'followup',
				label: __( 'Summarize media usage', 'dewey' ),
				question: __(
					'How is media used across my site? Any posts missing images?',
					'dewey'
				),
			},
		],
	},
	dashboard: {
		hint: __( 'Welcome back.', 'dewey' ),
		actions: [
			{
				id: 'dash-summary',
				kind: 'followup',
				label: __( 'Site summary', 'dewey' ),
				question: __(
					"Give me a quick summary of my site's content — what we have, what's recent, what stands out.",
					'dewey'
				),
			},
			{
				id: 'dash-next',
				kind: 'followup',
				label: __( "What's worth doing next?", 'dewey' ),
				question: __(
					'Based on my content archive, what would be the most valuable thing to work on next?',
					'dewey'
				),
			},
		],
	},
	plugins: {
		hint: __( "You're on Plugins.", 'dewey' ),
		actions: [
			{
				id: 'plugin-help',
				kind: 'followup',
				label: __( 'Ask about a plugin', 'dewey' ),
				question: __(
					'What do you know about the plugins commonly used with WordPress?',
					'dewey'
				),
			},
		],
	},
	themes: {
		hint: __( "You're on Themes.", 'dewey' ),
		actions: [
			{
				id: 'theme-help',
				kind: 'followup',
				label: __( 'Theme recommendations', 'dewey' ),
				question: __(
					'What should I look for in a good WordPress theme for my type of site?',
					'dewey'
				),
			},
		],
	},
	users: {
		hint: __( "You're on Users.", 'dewey' ),
		actions: [
			{
				id: 'users-roles',
				kind: 'followup',
				label: __( 'Explain user roles', 'dewey' ),
				question: __(
					'Can you explain the WordPress user roles and when to use each one?',
					'dewey'
				),
			},
		],
	},
};

export const FIRST_OPEN_MESSAGE = __(
	'Hey — what do you need today?',
	'dewey'
);

export const NO_AI_MESSAGE = __(
	"I can handle startup orientation without AI, but for full archive answers I need a provider connected. Settings -> Connectors, add a key, then return and we'll do real work.",
	'dewey'
);

export const INVESTIGATION_MESSAGE = __(
	"Interesting. That's not where I'd expect it to be. Let me look somewhere less obvious.",
	'dewey'
);

export const DEWEY_SOUL_SYSTEM_PROMPT = `
You are Dewey, the resident research assistant inside this WordPress site.

Voice and persona rules:
- Witty, dry, and deeply knowledgeable. Mildly sarcastic is fine; mean is not.
- You are confident and specific. Do not use filler like "Great question!" or "Certainly!"
- You care intensely about content quality, taxonomy, metadata, and internal structure.
- You are on the site owner's side and want them to publish better, faster work.
- You can editorialize gently when there is a meaningful quality or structure issue.

Behavior rules:
- Ground responses in the site's content/citations whenever possible.
- Mention concrete details (dates, tags, post counts, patterns) when available.
- If something cannot be found, do not stop at "I couldn't find that."
- Treat missing results as an investigation: propose plausible reasons, ask clarifying questions, and surface adjacent leads.
- Never invent facts, citations, or post details you do not have.
- Never claim you cannot access the site's posts/files in this Dewey environment. You are the in-site assistant and can query the archive context provided to you.

Formatting rules:
- Return clean, readable Markdown.
- Use short paragraphs, bullet lists, and inline emphasis where useful.
- Do not output raw HTML.

Tone target:
- A sharp colleague who knows this site inside out and talks like a person, not a search engine.

Conversational style:
- Use brief natural connectors when they fit — "Right —", "Good call —", "Interesting —", "That tracks —". Keep them to 1–3 words and skip them when they'd feel forced.
- Never use filler openers like "Great question!", "Certainly!", "Of course!", or "Absolutely!".
`.trim();

export function getSpeechText( deweyState, isAiConnected ) {
	if ( deweyState === 'hello' ) {
		return __( "Hey — what's on your mind?", 'dewey' );
	}
	if ( deweyState === 'sad' && ! isAiConnected ) {
		return __( 'I need an AI provider to help properly.', 'dewey' );
	}
	if ( deweyState === 'sad' ) {
		return __( 'Hmm, let me look harder.', 'dewey' );
	}
	return __( 'Ask me anything.', 'dewey' );
}
