# Dewey Threat Model

## System Context

Dewey is a WordPress admin assistant plugin that:

- accepts authenticated admin/editor user input
- retrieves post/archive content
- calls configured AI providers through WordPress AI Client
- returns answers and source references to the WP admin UI

## Assets

- WordPress user session and capability boundaries
- Post/archive content (including private editorial context)
- Dewey settings and index state
- Admin edit URLs and route actions
- API availability/performance

## Trust Boundaries

1. Browser client -> WordPress REST API
2. WordPress plugin code -> database/custom index table
3. WordPress plugin code -> AI provider connector
4. Admin UI rendering of returned content

## Entry Points

- `POST /wp-json/dewey/v1/query`
- `POST /wp-json/dewey/v1/confirm-action`
- `POST /wp-json/dewey/v1/reindex`
- `GET /wp-json/dewey/v1/status`

## Top Threats and Controls

### 1) Broken Access Control

- Threat: user without sufficient capability invokes protected routes.
- Control: route permission callbacks + capability checks (`edit_posts`, `manage_options`).

### 2) CSRF Against Authenticated Users

- Threat: forged cross-site requests from third-party pages.
- Control: enforce `X-WP-Nonce` verification (`wp_rest` nonce).

### 3) Unrestricted Resource Consumption

- Threat: repeated expensive queries degrade service.
- Control: per-user rate limiting by route bucket and bounded payload sizes.

### 4) Input/Output Injection

- Threat: malformed or unsafe strings lead to UI/script abuse.
- Control: strict argument validation/sanitization; sanitize response metadata and URLs; render non-link fallback for invalid URLs.

### 5) Privileged Action Abuse

- Threat: reindex/settings updates triggered by insufficiently privileged users.
- Control: separate admin-only checks for privileged mutations.

## Residual Risk

- App-level limits can still be bypassed by distributed abuse: add edge rate limiting/WAF.
- Third-party AI provider behavior/data handling depends on provider configuration.
- New route additions can regress controls if not reviewed.

## Security Regression Rules

Any endpoint/auth changes must preserve:

- explicit `permission_callback`
- nonce verification for protected routes
- capability checks matching least privilege
- argument validation/sanitization
- no unsafe URL emission to client

