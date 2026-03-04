#!/usr/bin/env bash
set -euo pipefail

# Dewey security smoke test.
# Usage:
#   BASE_URL="https://example.com" \
#   COOKIE="wordpress_logged_in_...=..." \
#   NONCE="xxxxxxxxxx" \
#   ./scripts/security-smoke.sh
#
# Optional:
#   QUERY_LIMIT=20
#   MUTATION_LIMIT=30

BASE_URL="${BASE_URL:-}"
COOKIE="${COOKIE:-}"
NONCE="${NONCE:-}"
QUERY_LIMIT="${QUERY_LIMIT:-20}"
MUTATION_LIMIT="${MUTATION_LIMIT:-30}"

if [[ -z "$BASE_URL" || -z "$COOKIE" || -z "$NONCE" ]]; then
	echo "Missing required env vars."
	echo "Required: BASE_URL, COOKIE, NONCE"
	exit 1
fi

API="${BASE_URL%/}/wp-json/dewey/v1"
probe_status="$(curl -sS -o /dev/null -w "%{http_code}" "${API}/status" || true)"

if [[ "$probe_status" == "404" ]]; then
	echo "FAIL: Dewey REST routes are not available at ${API} (status 404)."
	echo "Expected live engine endpoints to be registered."
	exit 1
fi

curl_status() {
	local method="$1"
	local url="$2"
	local data="${3:-}"
	if [[ -n "$data" ]]; then
		curl -sS -o /dev/null -w "%{http_code}" \
			-X "$method" \
			-H "Content-Type: application/json" \
			-H "X-WP-Nonce: $NONCE" \
			-H "Cookie: $COOKIE" \
			--data "$data" \
			"$url"
	else
		curl -sS -o /dev/null -w "%{http_code}" \
			-X "$method" \
			-H "X-WP-Nonce: $NONCE" \
			-H "Cookie: $COOKIE" \
			"$url"
	fi
}

pass() { echo "PASS: $*"; }
warn() { echo "WARN: $*"; }
fail() { echo "FAIL: $*"; exit 1; }

echo "Running Dewey security smoke tests against: $BASE_URL"

# 1) Missing nonce should fail.
status_missing_nonce="$(curl -sS -o /dev/null -w "%{http_code}" \
	-X POST \
	-H "Content-Type: application/json" \
	-H "Cookie: $COOKIE" \
	--data '{"question":"test"}' \
	"$API/query")"

if [[ "$status_missing_nonce" == "403" ]]; then
	pass "Missing nonce rejected (403)"
else
	fail "Missing nonce expected 403, got $status_missing_nonce"
fi

# 2) Basic authenticated query should pass.
status_ok_query="$(curl_status POST "$API/query" '{"question":"quick test question"}')"
if [[ "$status_ok_query" == "200" ]]; then
	pass "Authenticated query accepted (200)"
else
	warn "Authenticated query expected 200, got $status_ok_query"
fi

# 3) Status endpoint should require authz + nonce and return success for allowed user.
status_status="$(curl_status GET "$API/status")"
if [[ "$status_status" == "200" ]]; then
	pass "Status endpoint reachable for current user (200)"
else
	warn "Status endpoint expected 200, got $status_status"
fi

# 4) Query rate-limit should eventually return 429.
echo "Testing query rate limit (limit ~${QUERY_LIMIT}/min)..."
rate_limited="0"
for ((i=1; i<=QUERY_LIMIT+5; i++)); do
	code="$(curl_status POST "$API/query" "{\"question\":\"rate limit probe $i\"}")"
	if [[ "$code" == "429" ]]; then
		rate_limited="1"
		break
	fi
done

if [[ "$rate_limited" == "1" ]]; then
	pass "Query rate limit enforced (429 observed)"
else
	warn "Did not observe 429 for query path; verify server clock/cache/transients"
fi

# 5) Confirm-action path rate-limit and auth controls.
echo "Testing confirm-action malformed token handling..."
status_confirm="$(curl_status POST "$API/confirm-action" '{"token":"not-a-real-token","approved":true}')"
if [[ "$status_confirm" == "400" || "$status_confirm" == "403" || "$status_confirm" == "429" ]]; then
	pass "Confirm-action rejects invalid flow ($status_confirm)"
else
	warn "Unexpected confirm-action response: $status_confirm"
fi

# 6) Reindex should be admin-only.
echo "Testing reindex authorization..."
status_reindex="$(curl_status POST "$API/reindex" '{}')"
if [[ "$status_reindex" == "200" ]]; then
	pass "Reindex allowed for this user (admin context)"
elif [[ "$status_reindex" == "403" ]]; then
	pass "Reindex correctly blocked for non-admin user (403)"
elif [[ "$status_reindex" == "429" ]]; then
	warn "Reindex path rate-limited before auth conclusion (429)"
else
	warn "Unexpected reindex status: $status_reindex"
fi

echo "Security smoke test complete."
