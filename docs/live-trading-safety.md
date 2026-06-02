# Live Trading Safety

## Current Status

Live trading is not enabled by default. This repository now contains the safety infrastructure needed to prepare for live trading, including an Upbit JWT signing client structure. The mock exchange remains the default test path and can execute sandbox-style tests without sending signed network requests.

## Execution Flow

```txt
strategy signal
  -> order_intents row
  -> risk checked
  -> WAITING_APPROVAL
  -> admin manual approval
  -> execution engine guard checks
  -> order_attempts audit row
  -> exchange client
  -> executed_orders / failed attempts
  -> trading_audit_logs
```

The execution engine blocks unless every guard passes:

- `ENABLE_REAL_TRADING === "true"`
- `LIVE_TRADING_CONFIRM === "true"`
- `KILL_SWITCH !== "true"`
- persisted kill switch is disabled
- provider host is allowlisted
- `order_intents.status === "APPROVED"`
- idempotency key is new or safely retryable
- order rate limit passes
- risk engine passes max notional/quantity checks

The Upbit client signs private requests with JWT HS512 and `query_hash` for request parameters. Non-idempotent order placement and cancel requests are not automatically retried; retries must go through the idempotency key and order attempt flow.

## Why AI Does Not Order

AI output is restricted to research summaries and risk-factor notes. It can be stale, incomplete, or wrong. A BUY/SELL strategy signal only creates an order intent. Execution still requires deterministic risk checks, manual approval, idempotency protection, rate limits, kill-switch state, and audit logging.

## Cloudflare Secrets And Vars

Required for admin controls:

```bash
wrangler secret put ADMIN_TOKEN
```

Required before any future live trading implementation:

```bash
wrangler secret put UPBIT_ACCESS_KEY
wrangler secret put UPBIT_SECRET_KEY
wrangler secret put LIVE_TRADING_CONFIRM
```

Recommended vars:

```txt
ENABLE_REAL_TRADING=false
LIVE_TRADING_CONFIRM=false
KILL_SWITCH=false
PROVIDER_ALLOWLIST_HOSTS=api.upbit.com
MAX_TRADE_KRW=50000
```

Never define exchange keys, `ADMIN_TOKEN`, or Supabase service keys as `VITE_*` values. Vite variables are public frontend bundle data.

## Kill Switch

The kill switch can be controlled two ways:

- Env-level: set `KILL_SWITCH=true`.
- Persisted state: use the admin API.

```bash
curl -X POST "$WORKER_URL/api/trading/kill-switch/enable" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X POST "$WORKER_URL/api/trading/kill-switch/disable" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

When either kill switch is enabled, all live order execution is blocked.

## Manual Approval

Order intents are listed and approved through admin-protected APIs:

```bash
curl "$WORKER_URL/api/trading/order-intents" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X POST "$WORKER_URL/api/trading/order-intents/<id>/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X POST "$WORKER_URL/api/trading/order-intents/<id>/reject" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Approvals and rejections are written to `order_approvals` and `trading_audit_logs`.

## Idempotency

Key rule:

```txt
intent:<order_intent_id>:<MARKET>:<SIDE>
```

Fallback for signal-created intents:

```txt
signal:<signal_id>:<MARKET>:<SIDE>
```

If a key already has `RESERVED`, `EXECUTED`, or `FAILED` status, another automatic order is blocked. Failed keys require manual review and a new operator decision before any retry. Production reservation uses an insert-first repository method so duplicate concurrent attempts collide on the primary key instead of both reaching the exchange.

## Persistent Rate Limit And Backoff

Order operations use a stricter limit than reads:

- order API: 1 request per second, 5 per minute
- query API: 5 requests per second, 60 per minute

Rate-limit failures are blocks, not silent delays. The production path uses `SupabaseAtomicRateLimiter`, backed by the `consume_trading_rate_limit` RPC and a transaction advisory lock, so limits survive Worker isolate restarts and avoid count-then-insert races. Exchange reads use bounded exponential backoff. Non-idempotent order placement and cancellation are not blindly retried.

## Provider Host Allowlist

Signed exchange requests are restricted to HTTPS allowlisted hosts. Default Upbit hosts:

```txt
api.upbit.com
api-manager.upbit.com
```

Set `PROVIDER_ALLOWLIST_HOSTS` to narrow this further. Requests to other hosts are blocked before fetch/signing.

## Mock/Sandbox Tests

Run safety tests:

```bash
npm test --workspace worker
```

The tests verify live flag blocks, second confirmation flag blocks, kill switch blocks, manual approval blocks, duplicate idempotency blocks, mock exchange behavior, allowlist rejection, and rate-limit blocking.

## Incident Stop Procedure

1. Set `KILL_SWITCH=true` in Cloudflare.
2. Call `POST /api/trading/kill-switch/enable`.
3. Disable or rotate exchange API keys.
4. Review `order_attempts`, `executed_orders`, `trading_audit_logs`, `risk_logs`, and `rate_limit_logs`.
5. Keep `ENABLE_REAL_TRADING=false` until the root cause is fixed and reviewed.

## Live Activation Checklist

- Apply `supabase/trading-live-schema.sql`.
- Confirm RLS is enabled and anon access is revoked for live order/audit tables. Worker live writes require the server-only Supabase service role key; do not expose it to clients.
- Keep exchange keys as Worker secrets only.
- Verify `ADMIN_TOKEN` is strong and rotated.
- Confirm `ENABLE_REAL_TRADING=false` by default.
- Confirm `LIVE_TRADING_CONFIRM` is a separate secret.
- Confirm kill switch works from env and API state.
- Run `npm test --workspace worker` and `npm run build --workspace worker`.
- Test only against mock/sandbox first.
- Run live exchange integration only with minimum-size orders after a separate operator review.
