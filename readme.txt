=== Dewey ===
Contributors: regionallyfamous
Tags: ai, content search, admin assistant, writing assistant, knowledge base
Requires at least: 7.0
Tested up to: 7.0
Requires PHP: 8.1
Stable tag: 1.0.15
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Your best content is already written. Dewey helps your team query your archive in wp-admin and get grounded AI answers with citations.

== Description ==

Dewey brings your editorial memory into wp-admin so your team can move faster with less reinvention.

When teams move fast, memory breaks: strong ideas get buried, duplicate posts appear, and voice drifts.

Dewey gives editors a better workflow right now:

* Ask plain-English questions in wp-admin.
* Retrieve relevant matches from your archive with source citations.
* Generate concise AI answers from that context using WordPress 7.0 AI infrastructure.
* Verify AI connection status and jump directly to Settings > Connectors.
* Run a protected reindex flow when you need to refresh indexed retrieval.

The result is faster publishing, stronger consistency, and less reinvention.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/dewey` directory, or install via the WordPress plugin screen.
2. Activate the plugin through the "Plugins" screen in WordPress.
3. Configure your AI provider in `Settings > Connectors`.
4. Open wp-admin and use the Dewey panel.

== Frequently Asked Questions ==

= Does Dewey send all my content to the AI provider? =

No. Dewey retrieves relevant excerpts first and sends only the minimum context needed to answer your question.

= Who can use Dewey? =

Dewey runs in wp-admin for authenticated users with appropriate capabilities. Query/status routes are for editors, while maintenance actions like reindex are admin-only.

== Changelog ==

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

