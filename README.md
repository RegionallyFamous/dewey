# Dewey for WordPress

**Turn old posts into present-moment leverage.**

Dewey is your editorial memory inside wp-admin.  
Instead of rewriting what your team already figured out, Dewey helps you surface prior insight fast, stay consistent, and ship with confidence.

Built by [Regionally Famous](https://regionallyfamous.com).

## Why Teams Use Dewey

- **Recover buried thinking quickly** before it gets rewritten from scratch.
- **Keep voice and positioning tight** by grounding decisions in your own archive.
- **Reduce editorial thrash** when deadlines are close and context is scattered.
- **Move from “I know we wrote this” to “here it is”** in one place.

## What You Get Today

- A polished floating Dewey assistant in wp-admin with animated character and persistent chat.
- Conversational AI answers grounded in your archive — with inline citations and source snippet previews.
- Follow-up question chips after every response so the conversation stays natural.
- **Navigation command suggestions**: as you type, Dewey surfaces instant go-to chips for any wp-admin screen — posts, media, themes, settings, users, and more. Works even without an AI provider connected.
- Page-aware context: Dewey detects which wp-admin screen you're on and offers relevant suggestions.
- Post-aware context: when editing a specific post, Dewey knows the title, status, tags, and categories.
- Smart return greeting: reopening Dewey within 4 hours references your last topic.
- Site stats grounding: published post count, last published date, and top categories injected into every response.
- Copy-to-clipboard, retry on error, and Alt+Shift+D keyboard shortcut.
- Relative message timestamps that update live.
- BM25-style indexed retrieval with AI-powered query expansion and automatic re-indexing on content changes.
- Retrieval resilience features: title-focused fallback matching, date-aware ranking bias, and deterministic no-hit refinement prompts.
- Index quality monitoring: status telemetry counters, staleness signals, and automatic orphan-entry integrity cleanup.
- Tone, verbosity, and citation style settings wired into the AI prompt.
- Dewey-voiced settings confirmations and error messages.
- Server-side retrieval + generation pipeline built on WordPress 7.0 AI infrastructure.
- Hardened plugin foundation with capability, nonce, and per-route rate-limit guardrails.

## Requirements

- WordPress `7.0+`
- PHP `8.1+`

## Get Started

1. Install dependencies and build assets.
2. Drop `dewey/` into `wp-content/plugins/`.
3. Activate in WordPress admin.
4. Click Dewey and start asking.

## Localization

Generate or refresh the translation template (`.pot`):

```bash
npm run i18n:pot
```

This writes `languages/dewey.pot` for translators and GlotPress/import workflows.

## Wiki (Technical Docs)

The long-form technical details now live in the wiki docs:

- [Wiki Home](docs/wiki/Home.md)
- [Getting Started](docs/wiki/Getting-Started.md)
- [Architecture and Scope](docs/wiki/Architecture-and-Scope.md)
- [Developer Guide](docs/wiki/Developer-Guide.md)
- [Release Checklist](docs/wiki/Release-Checklist.md)
- [Security Model](docs/THREAT_MODEL.md)

## License

GPL-2.0-or-later
