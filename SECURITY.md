# Dewey Security

This file documents the current security posture of the code in this repository.

## Security Contact

If you discover a vulnerability, report it privately to the maintainer before public disclosure.

- Include affected version, attack path, proof of concept, and impact.

## Current Security Controls (v1.0.9)

- Direct access guards in PHP files (`defined( 'ABSPATH' ) || exit;`).
- Strict settings sanitization/allowlisting in `Dewey_Settings`.
- Admin asset loading gated by capability and allowlisted admin screens.
- Admin asset loading bypasses AJAX/cron contexts and supports a final policy filter gate.
- Asset manifest normalization before script/style registration (defensive type checks).
- Frontend prompt input normalization (control-char stripping and max-length guard).
- Frontend submit throttling and bounded in-memory chat history.
- Build/release preflight checks (lint, tests, docs consistency, security scan).
- Release packaging hardening:
  - slug validation,
  - path containment checks,
  - symlink rejection,
  - non-regular file rejection,
  - strict runtime allowlist.
- Static security scanner checks for high-risk PHP patterns:
  - code execution primitives (`eval`, `assert`, `create_function`),
  - command execution (`shell_exec`, `exec`, `passthru`, `system`),
  - unsafe decoding/deserialization (`base64_decode`, `unserialize`),
  - dynamic include from superglobals,
  - `preg_replace` with `/e` modifier.
- Static security scanner checks for high-risk frontend patterns:
  - `eval` and `new Function`,
  - direct HTML sink usage (`dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`).

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

