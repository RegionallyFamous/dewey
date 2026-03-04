# Architecture and Scope

## Current Scope

The current repository ships:

- wp-admin Dewey UI shell and floating chat panel
- local onboarding/startup conversation handling
- AI connection status messaging
- Dewey REST engine routes (`query`, `status`, `reindex`, `confirm-action`)
- server-side retrieval and AI answer generation pipeline
- indexed retrieval scaffold with reindex/status support
- settings sanitization and intent routing utility classes

## Not Yet Shipped

This repo does not currently ship:

- full indexing/retrieval backend pipeline

## High-Level Structure

```text
dewey/
├── dewey.php
├── includes/
│   ├── class-dewey-intent-router.php
│   └── class-dewey-settings.php
├── src/
│   ├── components/
│   └── index.js
├── scripts/
└── docs/
```
