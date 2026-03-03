# Dewey for WordPress

Turn years of posts into instant answers in WP Admin with a conversational UI.

Built by [Regionally Famous](https://regionallyfamous.com).

## Current Scope (v1.0.6)

This repository currently ships:

- A floating Dewey panel in wp-admin.
- Local chat UX with starter prompts and Dewey state animations.
- AI-connection detection messaging from WordPress AI configuration.
- Settings sanitization and an intent router utility class.

This repository does **not** currently ship live archive retrieval or REST routes in plugin PHP.

## Requirements

- WordPress `7.0+`
- PHP `7.4+`

## Installation

```bash
# 1) Install JS dependencies
npm install

# 2) Build plugin assets
npm run build

# 3) Copy dewey/ into wp-content/plugins/
# 4) Activate plugin in WP Admin
```

For development:

```bash
npm run start
```

## Testing and Checks

```bash
# JS/CSS lint
npm run lint

# Frontend unit tests
npm run test:js

# PHP class tests (router/settings)
npm run test:php

# Docs + security baseline checks
npm run check
```

## Releasing a New Plugin Version

```bash
# Full preflight checks + build + packaging
npm run release -- 1.0.6

# Dry run (no zip write, no build)
npm run release:dry-run -- 1.0.6 --skip-build
```

Release archives are generated in `releases/` as `dewey-<version>.zip`.

## Project Structure

```text
dewey/
├── dewey.php
├── build/
├── includes/
│   ├── class-dewey-intent-router.php
│   └── class-dewey-settings.php
├── src/
│   └── components/dewey/
├── scripts/
│   ├── release-plugin.js
│   ├── check-docs-consistency.js
│   └── check-security-basics.js
└── readme.txt
```

## Roadmap

- Wire chat UI to real plugin REST endpoints.
- Add archive retrieval/indexing pipeline.
- Expand automated PHP/JS test coverage.
- Add CI gates for release and WordPress.org submission flow.

## License

GPL-2.0-or-later
