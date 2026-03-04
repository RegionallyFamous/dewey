# Developer Guide

## Quality Checks

```bash
npm run lint
npm run test:js
npm run test:php
npm run check
```

## Localization

```bash
npm run i18n:pot
```

This regenerates `languages/dewey.pot` from PHP and JS i18n strings.

## What `npm run check` Includes

- docs consistency checks
- baseline static security checks

## Frontend Notes

- UI is built with `@wordpress/element` and `@wordpress/components`
- Dewey behavior lives primarily in `src/components/dewey/`
- chat logic and guardrails are centralized in `useDeweyChat`
- Dewey voice/persona is centralized in `src/components/dewey/copy.js` and passed to `/query` as `assistant_system_prompt`

## Navigation Commands

Navigation chip suggestions are handled entirely client-side with no API calls:

- **`commands.js`** — static registry of ~40 wp-admin commands (posts, media, appearance, users, plugins, settings, tools). Each entry has a `descriptions[]` array of natural-language match phrases.
- **`useNavigationCommands.js`** — builds a Fuse.js index from the static registry plus items scraped from `#adminmenu` at load time. Debounces input at 280ms, requires ≥3 chars, returns up to 3 matches.
- Suggestions appear above the chat form in `DeweyPanel` and disappear while a query is submitting.
- Clicking a chip calls `navigate()` which resolves the URL against `ajaxurl` and navigates immediately — no AI call involved.
- The sidebar scraper validates all scraped URLs through `isSafeAdminUrl()` before they enter the Fuse index. Do not relax this check.

To add a new command, append an entry to `commands.js` following the existing structure. Tune the Fuse threshold (`0.36` in `useNavigationCommands.js`) only if you have a clear false-positive or false-negative case to justify it.

## Retrieval and Indexing Notes

- Retrieval logic and fallback behavior live in `includes/class-dewey-engine.php`
- Indexed scoring and integrity checks live in `includes/class-dewey-indexer.php`
- `/status` includes `index_health`, `integrity`, and retrieval `telemetry` for operational visibility
- Non-public indexing (draft/private) is admin-gated and opt-in via settings intent
- Admin screen context contract is injected from `dewey.php` (`dewey_build_admin_screen_context`) and sent on `/query` as `screen_context`
- WordPress reference snippets are sourced from `includes/knowledge-base.json` via `Dewey_Knowledge`

## Action Intents

- Intent parsing for create/list/trash/publish lives in `includes/class-dewey-intent-router.php`
- Execution and capability checks live in `includes/class-dewey-action-handler.php`
- Destructive actions require signed action tokens and run through `/execute-action`
- Frontend action chips and result rendering live in `useDeweyChat` + `ui/MessageList`

## Eval Fixtures

- Retrieval replay fixtures live in `tests/evals/retrieval-evals.json`
- PHP core tests load and replay these fixture questions to catch retrieval regressions early
