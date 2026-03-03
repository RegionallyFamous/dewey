# Dewey Security

This file documents the current security posture of the code in this repository.

## Security Contact

If you discover a vulnerability, report it privately to the maintainer before public disclosure.

- Include affected version, attack path, proof of concept, and impact.

## Current Security Controls (v1.0.6)

- Direct access guards in PHP files (`defined( 'ABSPATH' ) || exit;`).
- Strict settings sanitization/allowlisting in `Dewey_Settings`.
- Admin asset loading gated by capability and screen-level checks.
- Build/release preflight checks (lint, tests, docs consistency, security scan).
- Release packaging hardening:
  - slug validation,
  - path containment checks,
  - symlink rejection,
  - strict runtime allowlist.

## Current Scope Notes

- This repository does not currently ship Dewey REST endpoints.
- Security statements about nonce/capability checks for Dewey REST routes will be added when those routes are implemented.

## Pre-Release Security Checklist

Run before shipping:

1. `npm run lint`
2. `npm run test:js`
3. `npm run test:php`
4. `npm run check`
5. `npm run release -- <version>`

## Future Hardening Roadmap

- Add REST endpoints with explicit `permission_callback` checks.
- Add endpoint-level nonce and capability negative tests.
- Add CI dependency audit and security-policy enforcement gates.

