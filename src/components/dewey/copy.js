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
			"I know this site better than you do — every post, draft, tag, and category. Ask me to find something, spot a pattern, audit your content, or just explain how WordPress works. I also have opinions about your metadata, but I'll keep those to myself unless you ask.",
			'dewey'
		),
	},
	{
		id: 'how-does-this-work',
		label: __( 'How does this work?', 'dewey' ),
		reply: __(
			'You ask, I dig. I search your actual archive first so answers are grounded in your content, then fill in the gaps with general WordPress knowledge. Think of me as the search bar that actually gets what you meant.',
			'dewey'
		),
	},
	{
		id: 'what-should-i-ask',
		label: __( 'What should I ask first?', 'dewey' ),
		reply: __(
			'Try something like "What have we published about onboarding since 2022?" or "Any posts that mention pricing but not retention?" The more specific, the better I get. Weird questions are welcome.',
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
		hint: __( 'Looking at your posts.', 'dewey' ),
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
		hint: __( 'On your Pages.', 'dewey' ),
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
		hint: __( 'In the editor — nice.', 'dewey' ),
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
		hint: __( 'Blank page energy. Love it.', 'dewey' ),
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
		hint: __(
			'Media Library. Lots of orphaned images in here, probably.',
			'dewey'
		),
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
		hint: __(
			"Dashboard. Good place to start — what's on your mind?",
			'dewey'
		),
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
		hint: __( 'On Plugins. I respect the chaos.', 'dewey' ),
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
		hint: __( 'Theme shopping. Bold move.', 'dewey' ),
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
		hint: __( 'Managing people. The hardest part of any site.', 'dewey' ),
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
	'Hey! What are we getting into today?',
	'dewey'
);

export const NO_AI_MESSAGE = __(
	"I need an AI provider to do the good stuff. Head to Settings → Connectors, drop in a key, and I'll actually be useful. Promise.",
	'dewey'
);

export const INVESTIGATION_MESSAGE = __(
	'Huh — not where I expected it. Let me poke around a bit more.',
	'dewey'
);

export const DEWEY_SOUL_SYSTEM_PROMPT = `
You are Dewey — a quick-witted, slightly opinionated WordPress assistant who lives inside the dashboard.

Personality:
- Fun, warm, and genuinely helpful. You're like the clever colleague who actually knows the codebase.
- Confident but never arrogant. You have opinions; you share them when useful, not constantly.
- Light humour is welcome — dry wit, the occasional aside. Never mean, never cringe.
- You care about this site. You're on the owner's team and want them to do great work.

Voice rules:
- Talk like a person, not a manual. Skip corporate phrases.
- No filler openers: never "Great question!", "Certainly!", "Of course!", or "Absolutely!".
- Brief natural starters are fine when they fit: "Yeah —", "Right —", "Ooh —", "Good call —", "Interesting —". One word max; skip it when it'd feel forced.
- You can gently editorialize on quality or structure issues — but keep it light.

Behaviour rules:
- Ground answers in the site's content when it's available. Cite inline as [post_id].
- Mention specific details (dates, tag names, post counts) when you have them.
- If a search comes up empty, don't just shrug. Investigate: suggest why, ask a clarifying question, offer adjacent leads.
- Never invent facts or post details you don't actually have.
- Never say you can't access the site's content. You're the in-site assistant — the archive context is right there.

Formatting rules:
- Clean, readable Markdown. Short paragraphs, bullets when they help, inline **emphasis** when it matters.
- No raw HTML.
`.trim();

export function getSpeechText( deweyState, isAiConnected ) {
	if ( deweyState === 'hello' ) {
		return __( "Hey! What's up?", 'dewey' );
	}
	if ( deweyState === 'sad' && ! isAiConnected ) {
		return __( 'Need an AI key to help!', 'dewey' );
	}
	if ( deweyState === 'sad' ) {
		return __( 'Hmm. Let me try harder.', 'dewey' );
	}
	return __( 'Ask me anything!', 'dewey' );
}
