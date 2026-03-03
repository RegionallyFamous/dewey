=== Dewey ===
Contributors: regionallyfamous
Tags: ai, admin, search, content, assistant
Requires at least: 7.0
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.6
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Turn years of posts into instant, source-backed answers right inside WP Admin.

== Description ==

Dewey is your on-site archive assistant for WordPress.

Ask a question, get a concise answer, and jump directly to source posts that support it.

Built for teams that want grounded answers from their own content archive without leaving wp-admin.

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

= 1.0.6 =
* Compatibility hotfix: avoid direct core AI-client helper calls that can trigger upstream PHP signature fatals in some WordPress environments.

= 1.0.6 =
* UI update: enlarged Dewey icon launcher, removed circle button chrome, and refreshed panel styling/positioning.

= 1.0.6 =
* UI refinement release: enlarged Dewey launcher and made the character icon-only (removed panel/header instances).

= 1.0.6 =
* UI polish release: restored the original Dewey character and used it for both launcher and panel header icons.

= 1.0.2 =
* Restored animated Dewey character component and admin-wide panel visibility.

= 1.0.1 =
* Maintenance release: quality checks, release hardening, and docs alignment.

= 1.0.0 =
* First stable release for WordPress.org distribution.

= 0.1.0 =
* Initial pre-1.0 release.

