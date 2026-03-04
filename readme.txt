=== Dewey ===
Contributors: regionallyfamous
Tags: ai, admin assistant, content management, writing assistant, productivity
Requires at least: 7.0
Tested up to: 7.0
Requires PHP: 8.1
Stable tag: 1.0.22
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

An AI assistant that lives in wp-admin. Ask questions about your content, navigate anywhere instantly, and get things done without leaving the panel.

== Description ==

Dewey sits in the corner of wp-admin as a small chat panel. Ask it something, and it goes to work — searching your content, navigating to the right screen, or creating something new, all without making you click through menus.

**Ask questions about your content**

Your archive is a goldmine that most teams never fully use. Dewey makes it searchable in plain English:

* "What have we written about email marketing?" — Dewey finds the relevant posts and surfaces exact excerpts with links.
* "Have we covered this topic before?" — catch duplicates before you write them.
* "What did we publish about onboarding last year?" — date-aware search cuts through the noise.

Answers are grounded in your actual content with inline citations. After every response, Dewey suggests follow-up questions so the conversation stays useful.

**Navigate anywhere, instantly**

No more digging through menus to find the right screen. Start typing in Dewey and go-to chips appear for any wp-admin destination — posts, pages, plugins, users, theme customizer, whatever. Just click and you're there. No AI provider required for this.

**Get things done by asking**

This is where Dewey goes beyond search. Tell it what you want and it does it:

* "Create a new draft about summer recipes" — done. A draft appears and Dewey hands you the editor link.
* "Show me my recent drafts" — Dewey lists them with direct edit links.
* "Publish my onboarding post" — Dewey finds it, tells you what it found, and asks you to confirm before anything goes live.
* "Trash the welcome page" — same: Dewey finds it, proposes the action, waits for your ok.

Dewey only does what your WordPress role allows. If you can't publish, Dewey can't publish on your behalf.

**Knows where you are**

Dewey is aware of your current context — which screen you're on, which post you're editing, what that post's tags and status are. Ask "what should I write next?" and Dewey knows the post you're working on. Open it on the Users screen and it suggests user-relevant tasks.

**Stays in the conversation**

Your chat thread persists across page loads. Close the panel, navigate somewhere else, reopen it — the conversation is still there. Within four hours of your last session, Dewey greets you by picking up where you left off.

**The small stuff that adds up**

* Alt+Shift+D to open and close the panel from anywhere in wp-admin.
* Copy button on every assistant message.
* Retry button when something goes wrong — with a human explanation of what happened.
* Relative timestamps on all messages.
* Adjustable tone (casual or precise), verbosity (concise or detailed), and citation style — just ask.

== Installation ==

1. Upload the plugin to the `/wp-content/plugins/dewey` directory, or install via the WordPress plugin screen.
2. Activate the plugin through the "Plugins" screen in WordPress.
3. Connect an AI provider in `Settings > Connectors`.
4. Open wp-admin and click the Dewey icon in the bottom corner.

Navigation commands and content actions work immediately. AI-backed questions and answers require a connected provider.

== Frequently Asked Questions ==

= Does Dewey send all my content to the AI provider? =

No. Dewey retrieves relevant excerpts from your archive first, then sends only the minimum context needed to answer your question. Your full content never leaves your server.

= Can Dewey edit or delete my content without asking? =

No. Dewey proposes destructive actions (trash, publish) and waits for you to confirm before anything is changed. It also respects your WordPress role — if your account can't do something, Dewey can't do it either.

= Do I need an AI provider for everything? =

No. Navigation commands (the go-to chips) and content actions like creating drafts work without any AI provider connected. You only need a provider for open-ended questions and answers.

= Who can use Dewey? =

Any authenticated wp-admin user with at least the editor capability. Actions that affect site-wide settings (like reindexing) are restricted to admins.

= What AI providers does Dewey support? =

Dewey works with any provider configured through WordPress's built-in Settings > Connectors interface.

== Changelog ==

= 1.0.22 =
* Easter eggs: 14 hidden responses to secret phrases (sudo, hello world, the loop haiku, wp_die(), coffee jitter, konami, 42, meaning of life, better than ChatGPT, who made you, tell me a joke, roast my site, are you AI, what can you do).
* Date-aware greetings: April Fools' Day, WordPress Birthday (May 27), Friday afternoon, Monday morning flavour text injected into the welcome message.
* Dark mode greeting: Dewey notices and comments on the colour scheme on first open.
* Konami code: ↑↑↓↓←→←→BA triggers a confetti burst in the panel.
* FAB easter eggs: 10 rapid clicks triggers a spin animation; holding the FAB for 3 seconds shows a sleepy speech bubble.
* Coffee/☕ trigger: typing "coffee" makes the FAB jitter with caffeinated energy.
* wp_die() trigger: the panel fades out and back in with a punchline.

= 1.0.21 =
* Write actions: ask Dewey to create a draft post or page, list your recent content, trash a post, or publish a draft — it does it. Destructive actions (trash, publish) always wait for your confirmation first.
* All write actions respect your WordPress role. Dewey cannot do anything your account cannot do.

= 1.0.20 =
* Navigation command suggestions: start typing and go-to chips appear for any wp-admin screen. No AI provider needed — works instantly from the first keystroke.

= 1.0.19 =
* Retrieval resilience: no-hit archive lookups now trigger targeted refinement prompts with possible title suggestions instead of dead-end responses.
* Search quality: added title-focused fallback matching, date-aware ranking bias, and taxonomy phrase weighting for tags/categories in indexed scoring.
* Index health: status now exposes staleness and integrity signals, with automatic orphan cleanup and retrieval telemetry counters for ongoing quality monitoring.

= 1.0.18 =
* Patch release prep: version alignment and release packaging refresh.
* Quality pass validated with lint, tests, security/docs checks, and build verification.

= 1.0.17 =
* Follow-up question chips: AI generates 3 contextual follow-up questions after each response, rendered as tappable chips for natural conversation continuation.
* Page-aware proactive opener: Dewey detects the current wp-admin screen (posts list, editor, dashboard, plugins, themes, users, media) and surfaces contextually relevant suggestions when you open the panel.
* Current post context: when editing a specific post, Dewey knows the title, status, tags, and categories and can reference them without needing to search.
* Smart return greeting: reopening Dewey within 4 hours of a recent conversation shows a pick-up greeting referencing the last topic discussed.
* Site stats grounding: published post count, last published date, and top categories are injected into every system instruction so Dewey can cite real numbers without a retrieval call.
* Copy-to-clipboard button on all assistant messages — hover to reveal, 2-second confirmed feedback.
* Citation snippet preview: a 2-line excerpt from each matched post is shown below the citation link.
* Retry button on error messages with Dewey-voiced error copy.
* Alt+Shift+D keyboard shortcut to open and close the panel from anywhere in wp-admin.
* Relative message timestamps (just now / X min ago) that update live.
* Dewey-voiced settings confirmations: changing tone, verbosity, or citation style triggers a specific, on-brand confirmation message.
* Time-of-day greeting (Morning/Afternoon/Evening/Working late) addressed to the current user's display name.

= 1.0.16 =
* Reliability: fixed index rebuild pagination so large sites index all matching posts, not just the first batch.
* Voice consistency: `/query` now accepts and sanitizes `assistant_system_prompt`, and the engine applies Dewey's canonical soul prompt when generating answers.
* Performance/security polish: tightened frontend connection refresh behavior and kept full quality + security preflight coverage for release readiness.

= 1.0.15 =
* Dewey now always answers — archive search enriches responses when content matches, AI general knowledge fills in when it doesn't.
* Added dual-mode AI prompts with a consistent Dewey personality voice.
* Rewrote all static UI copy to match the conversational tone.

= 1.0.14 =
* Remove hardcoded model preferences — AI provider now picks the best available model automatically.

= 1.0.13 =
* Fixed AI connection detection: switched config injection to wp_add_inline_script + wp_json_encode so PHP booleans arrive in JS correctly (root cause of always showing "not connected").
* Removed dead wp.aiClient/wp.ai runtime probes confirmed absent in WP 7.0.
* Fixed Connectors link URL resolution; simplified to trust PHP-injected admin_url() directly.
* Corrected duplicate ARIA labelling on the chat dialog.
* Committed previously untracked source files: REST controller, engine, indexer, mobile FAB component, POT translation template, and wiki docs.

= 1.0.12 =
* Release prep for Dewey 7.0 engine: full validation pass, docs alignment, and packaging readiness verification.
* Stability polish for REST query/confirm/reindex flows and final guardrail checks before distribution.

= 1.0.11 =
* Added Dewey REST engine endpoints (`/query`, `/status`, `/reindex`, `/confirm-action`) with server-side retrieval and AI answer generation.
* Added indexed retrieval scaffold with protected reindex operations and status reporting.
* Added capability, nonce, and per-route rate-limit guardrails for engine routes.
* Wired the chat UI to live Dewey API responses with citation rendering and confirm-action flow support.
* Fixed AI connection status detection: switched config injection from wp_localize_script to wp_add_inline_script + wp_json_encode so PHP booleans arrive in JavaScript as real booleans, not strings.
* Updated AI detection to align with WordPress AI Client APIs and Connectors-backed provider configuration checks.
* Fixed Connectors link always resolving to the correct Settings → Connectors URL.
* Corrected duplicate ARIA labelling on the chat dialog (aria-label shadowed by aria-labelledby).

= 1.0.10 =
* Release packaging refresh for the latest Dewey chat UX, AI-connection clarity, and localization readiness updates.
* Verified current dependency set, docs, and quality gates before distributing this build.

= 1.0.9 =
* Release readiness refresh: dependency updates, final QA pass, and packaging/tooling verification for current build pipeline.
* Improved admin-theme visual parity in Dewey chat and character polish from the latest UX/accessibility refinements.
* Developer modernization updates retained: PHP 8.1 baseline with stricter typed internals for settings and intent routing.

= 1.0.8 =
* PHP modernization release: migrated core settings/router internals to strict typing patterns and immutable rule/default maps for faster, safer runtime behavior.
* Raised minimum supported PHP version to 8.1 for modern language features and cleaner contracts.
* Internal performance pass: settings reads now use in-request caching to avoid repeated option normalization overhead.

= 1.0.7 =
* Design system alignment release: Dewey chat now uses WordPress component foundations and WP admin visual patterns.
* Theme-aware visual refresh: Dewey character and chat accents now inherit the active admin color scheme with improved dark-scheme readability.
* Accessibility and UX polish: enhanced keyboard/focus behavior, reduced-motion handling, and refined micro-interactions across the chat surface.

= 1.0.6 =
* Compatibility hotfix: avoid direct core AI-client helper calls that can trigger upstream PHP signature fatals in some WordPress environments.

= 1.0.5 =
* UI update: enlarged Dewey icon launcher, removed circle button chrome, and refreshed panel styling/positioning.

= 1.0.4 =
* UI refinement release: enlarged Dewey launcher and made the character icon-only (removed panel/header instances).

= 1.0.3 =
* UI polish release: restored the original Dewey character and used it for both launcher and panel header icons.

= 1.0.2 =
* Restored animated Dewey character component and admin-wide panel visibility.

= 1.0.1 =
* Maintenance release: quality checks, release hardening, and docs alignment.

= 1.0.0 =
* First stable release for WordPress.org distribution.

= 0.1.0 =
* Initial pre-1.0 release.

