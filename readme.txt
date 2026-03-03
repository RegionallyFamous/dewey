=== Dewey ===
Contributors: regionallyfamous
Tags: ai, content search, admin assistant, writing assistant, knowledge base
Requires at least: 7.0
Tested up to: 7.0
Requires PHP: 8.1
Stable tag: 1.0.9
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Your best content is already written. Dewey helps your team rediscover it fast and turn archive knowledge into confident publishing decisions.

== Description ==

Dewey turns your WordPress archive into an active writing partner.

When teams move fast, memory breaks: strong ideas get buried, duplicate posts appear, and voice drifts.

Dewey gives editors a better workflow:

* Ask plain-English questions in wp-admin.
* Pull relevant context from what you have already published.
* Respond with source-backed guidance so decisions are grounded, not guessed.

The result is faster publishing, stronger consistency, and less reinvention.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/dewey` directory, or install via the WordPress plugin screen.
2. Activate the plugin through the "Plugins" screen in WordPress.
3. Configure your AI provider in `Settings > AI > Connectors`.
4. Open wp-admin and use the Dewey panel.

== Frequently Asked Questions ==

= Does Dewey send all my content to the AI provider? =

No. Dewey is designed to retrieve relevant excerpts first and send only the context needed to answer the question.

= Who can use Dewey? =

Dewey endpoints are permission-gated and intended for authenticated WordPress users with appropriate capabilities.

== Changelog ==

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

