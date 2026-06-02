# Trading Research Architecture

## Scope

This project adds coin market research and paper trading preparation to the Cloudflare Worker + Supabase stack. It does not place real exchange orders. Live trading remains disabled by default and the live order client currently throws instead of executing.

## Structure

```txt
Cloudflare Worker scheduled/fetch handlers
  -> Upbit quotation reads
  -> optional CoinGecko market metadata reads
  -> Supabase market data storage
  -> AI research summary
  -> strategy signal
  -> paper-trade risk check
  -> paper trade and risk audit logs
```

Service files live under `apps/worker/src/services`:

- `upbit.ts`: KRW ticker and candle reads with bounded retry/backoff.
- `coingecko.ts`: optional broader market metadata reads.
- `supabase.ts`: Supabase REST read/write wrapper.
- `ai.ts`: market data summarization. It uses a mock provider when no AI key is configured.
- `strategy.ts`: BUY/SELL/HOLD signal generation and a disabled real-trading interface.
- `risk.ts`: paper-trading risk rules.
- `trading.ts`: collector, analysis, job logging, and paper execution orchestration.

## Why AI Must Not Directly Order

AI summaries can be wrong, stale, overconfident, or based on incomplete market data. The AI layer is therefore limited to summarizing stored data and listing risk factors. Order-like actions must pass through deterministic strategy and risk code, auditable logs, explicit admin authorization, and a paper-trading-only execution path.

## Flow

1. Data collection stores Upbit tickers and candles in Supabase.
2. AI research summarizes stored candles/tickers and writes `market_research` plus `ai_research_notes`.
3. Strategy code converts research and recent candles into a BUY/SELL/HOLD `strategy_signals` row.
4. Risk code checks max trade amount, daily trade count, daily loss rate, consecutive same-market entries, and live-trading flags.
5. Paper execution writes `paper_trades` for BUY/SELL signals only.
6. Every allow/block decision is written to `risk_logs`.

If a collector or analysis job fails, the Worker stops that job and records a `system_jobs` failure row.

## Supabase Tables

- `market_candles`: Upbit candle history by exchange, market, interval, and candle time.
- `market_tickers`: latest ticker snapshots with 24h movement/volume fields.
- `market_research`: market-level summaries and structured risk factors.
- `ai_research_notes`: AI/mock notes linked to research rows.
- `strategy_signals`: deterministic BUY/SELL/HOLD outputs.
- `paper_trades`: simulated fills with quantity, notional, reason, and simple PnL.
- `risk_logs`: allow/block audit trail for paper-trade decisions.
- `system_jobs`: scheduled/manual job status and failure records.

Apply `supabase/schema.sql` to your Supabase project before enabling collection.

## Cloudflare Secrets And Vars

Set secrets with Wrangler or the Cloudflare dashboard. Do not commit real values.

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put ADMIN_TOKEN
```

If your RLS policies do not permit Worker writes with the anon key, use a server-only `SUPABASE_SERVICE_ROLE_KEY` secret. Never expose it to Vite or any `VITE_*` variable.

Optional vars:

```txt
TRADING_MARKETS=KRW-BTC,KRW-ETH,KRW-XRP
TRADING_CANDLE_INTERVAL=minutes5
TRADING_ORDER_KRW=10000
MAX_TRADE_KRW=50000
DAILY_MAX_TRADES=8
DAILY_MAX_LOSS_RATE=0.03
ENABLE_REAL_TRADING=false
AI_PROVIDER=
AI_API_KEY=
COINGECKO_API_KEY=
```

## Cron Jobs

`wrangler.toml.example` contains example triggers:

- `*/5 * * * *`: collect major market prices.
- `0 * * * *`: generate hourly market summaries/signals.
- `5 0 * * *`: generate a daily report.

The current `wrangler.toml` is not changed, so existing deployments are not forced into cron execution.

## API

Read-only:

- `GET /api/trading/health`
- `GET /api/trading/markets`
- `GET /api/trading/candles?market=KRW-BTC&interval=minutes5`
- `GET /api/trading/research/latest`
- `GET /api/trading/signals/latest`
- `GET /api/trading/paper-trades`

Admin protected:

- `POST /api/trading/paper-trades/execute`
- `POST /api/admin/trading/run-collector`
- `POST /api/admin/trading/run-analysis`

Admin routes require `Authorization: Bearer <ADMIN_TOKEN>` or `X-Admin-Token`.

## Live Trading Follow-up Requirements

Before real orders are added:

- Add exchange-specific signed API clients on the Worker only.
- Keep exchange keys as Cloudflare secrets, never frontend values.
- Require explicit live mode flags in addition to `ADMIN_TOKEN`.
- Add idempotency keys, stronger rate limits, and per-route audit logs.
- Add allowlisted exchange hosts and reject redirects for order endpoints.
- Add integration tests against sandbox/exchange mock APIs.
- Add a manual approval workflow and emergency kill switch.
