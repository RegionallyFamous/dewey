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

## Retrieval and Indexing Notes

- Retrieval logic and fallback behavior live in `includes/class-dewey-engine.php`
- Indexed scoring and integrity checks live in `includes/class-dewey-indexer.php`
- `/status` includes `index_health`, `integrity`, and retrieval `telemetry` for operational visibility
- Non-public indexing (draft/private) is admin-gated and opt-in via settings intent
