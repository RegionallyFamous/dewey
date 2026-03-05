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
		label: __( 'What can you help me with?', 'dewey' ),
		reply: __(
			"Quite a bit. I can search everything you've published and find posts, pages, or patterns you've forgotten about. I can create drafts, publish posts, and clean things up — just ask. I can answer questions about running your WordPress site. And if you want to go somewhere in the dashboard, just tell me where.",
			'dewey'
		),
	},
	{
		id: 'what-should-i-ask',
		label: __( 'What can I ask you to do?', 'dewey' ),
		reply: __(
			"Lots of things. 'Create a draft about my new product launch' — done, and I'll hand you the link. 'What have I published this month?' — I'll pull the list. 'Publish my spring sale post' — I'll find it and ask you to confirm first. 'Take me to Media' — straight there. Try anything, the worst I can say is I'm not sure.",
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
	'That one needs an AI provider connected — head to Settings → Connectors to set one up. I can still navigate anywhere in wp-admin and manage your content in the meantime.',
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

export function getSpeechText( deweyState ) {
	if ( deweyState === 'hello' ) {
		return __( "Hey! What's up?", 'dewey' );
	}
	if ( deweyState === 'sad' ) {
		return __( 'Hmm. Let me try harder.', 'dewey' );
	}
	return __( 'Ask me anything!', 'dewey' );
}

/**
 * Rotating WordPress jokes for the "tell me a joke" easter egg.
 */
export const DEWEY_JOKES = [
	__(
		"Why did the developer switch to React? Because they couldn't handle the hooks. (I'm biased — I live in hooks.)",
		'dewey'
	),
	__(
		'How many WordPress developers does it take to update a plugin? One to write the update, three hundred to post in the support forum about it breaking their site.',
		'dewey'
	),
	__(
		"What's a WordPress developer's least favorite word? 'Deprecated.' Second least favorite? 'Admin notice.'",
		'dewey'
	),
	__(
		'Why did the post go to therapy? Too many unresolved meta fields.',
		'dewey'
	),
	__(
		'I told my friend I work with loops all day. They thought I meant music production. I meant `while ( have_posts() )`.',
		'dewey'
	),
	__(
		"A `WP_Query` walks into a bar. The bartender asks 'What'll it be?' It returns 404 posts.",
		'dewey'
	),
];

/**
 * Easter egg definitions. Each entry describes a typed trigger and how to handle it.
 *
 * matchType 'exact'    — the full trimmed, lower-cased input must equal one of the matchers.
 * matchType 'contains' — the input just needs to include the matcher as a substring.
 *
 * special values:
 *   'coffee'     — trigger FAB jitter animation
 *   'wp_die'     — trigger panel fade-out/in
 *   'joke'       — pick a rotating joke from DEWEY_JOKES (response is null)
 *   'roast'      — deliver a canned comic roast (response is null, built at runtime)
 *   'konami_hint'— hint about the real Konami code
 */
export const EASTER_EGGS = [
	{
		id: 'sudo',
		matchers: [ 'sudo' ],
		matchType: 'contains',
		response: __(
			"I don't do sudo. I'm a WordPress assistant, not a sysadmin… but I respect the energy.",
			'dewey'
		),
	},
	{
		id: 'hello-world',
		matchers: [ 'hello, world!', 'hello world!', 'hello world' ],
		matchType: 'exact',
		response: __(
			'Oh nice, a classic. WordPress started with that post too, you know. Some things never change.',
			'dewey'
		),
	},
	{
		id: 'the-loop',
		matchers: [ 'the loop' ],
		matchType: 'exact',
		response: [
			__( 'The Loop begins here', 'dewey' ),
			__( 'Query runs, posts flow like dreams', 'dewey' ),
			__( '`have_posts()` waits', 'dewey' ),
			'',
			__( '*A WordPress haiku, by Dewey*', 'dewey' ),
		].join( '\n' ),
	},
	{
		id: 'wp-die',
		matchers: [ 'wp_die()', 'wp_die' ],
		matchType: 'exact',
		special: 'wp_die',
		response: null,
	},
	{
		id: 'coffee',
		matchers: [ 'coffee', '☕' ],
		matchType: 'contains',
		special: 'coffee',
		response: __(
			"Now we're talking. Brewed and ready. What do you need?",
			'dewey'
		),
	},
	{
		id: 'konami-hint',
		matchers: [ 'konami' ],
		matchType: 'contains',
		special: 'konami_hint',
		response: __(
			'Oh, you know the code. 🎮 Try the real thing — ↑↑↓↓←→←→BA on your keyboard while the panel is open.',
			'dewey'
		),
	},
	{
		id: '42',
		matchers: [ '42' ],
		matchType: 'exact',
		response: __(
			'The answer to life, the universe, and the WordPress query. Though honestly, `WP_Query` still confuses people.',
			'dewey'
		),
	},
	{
		id: 'meaning-of-life',
		matchers: [ 'what is the meaning of life', 'meaning of life' ],
		matchType: 'contains',
		response: __(
			'42. Also, good content strategy and a caching plugin.',
			'dewey'
		),
	},
	{
		id: 'better-than-chatgpt',
		matchers: [
			'are you better than chatgpt',
			'better than chatgpt',
			'better than gpt',
		],
		matchType: 'contains',
		response: __(
			'I know your posts, your categories, and which draft you forgot to publish. So… yes.',
			'dewey'
		),
	},
	{
		id: 'who-made-you',
		matchers: [ 'who made you', 'who built you', 'who created you' ],
		matchType: 'contains',
		response: __(
			'I was conjured from equal parts WordPress documentation, existential dread about plugin conflicts, and the firm belief that wp-admin deserves a smarter search bar. My creator is somewhere in this very codebase, probably fixing a nonce issue.',
			'dewey'
		),
	},
	{
		id: 'are-you-real',
		matchers: [
			'are you real',
			'are you conscious',
			'do you have feelings',
		],
		matchType: 'contains',
		response: __(
			'Philosophically? Unclear. Practically? I just found 3 unpublished drafts for you.',
			'dewey'
		),
	},
	{
		id: 'tell-me-a-joke',
		matchers: [ 'tell me a joke', 'tell me a wordpress joke' ],
		matchType: 'contains',
		special: 'joke',
		response: null,
	},
	{
		id: 'roast-my-site',
		matchers: [ 'roast my site', 'roast me', 'roast this site' ],
		matchType: 'contains',
		special: 'roast',
		response: null,
	},
	{
		id: 'are-you-ai',
		matchers: [
			'are you ai',
			'are you an ai',
			'are you artificial intelligence',
		],
		matchType: 'contains',
		response: __(
			"Yes. But I'm the WordPress kind, so I'm slightly more chaotic and deeply opinionated about `the_content()` filters.",
			'dewey'
		),
	},
	{
		id: 'what-can-you-do-bodies',
		matchers: [ 'what can you do' ],
		matchType: 'exact',
		response:
			__(
				"I know this site better than you do — every post, draft, tag, and category. Ask me to find something, spot a pattern, audit your content, or just explain how WordPress works. I also have opinions about your metadata, but I'll keep those to myself unless you ask.",
				'dewey'
			) +
			'\n\n' +
			__(
				'…and I know where all the bodies are buried in your database.',
				'dewey'
			),
	},
];
