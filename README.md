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

- A polished floating Dewey assistant in wp-admin.
- Live archive query and answer flow via Dewey REST endpoints.
- Server-side retrieval + generation pipeline built on WordPress 7.0 AI infrastructure.
- Conversational starter flows with Dewey voice and stateful character animation.
- Clear AI-connection guidance when a provider is not configured.
- Hardened plugin foundation with capability, nonce, and rate-limit guardrails.

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
