create extension if not exists pgcrypto;

create table if not exists market_candles (
  id uuid primary key default gen_random_uuid(),
  exchange text not null,
  market text not null,
  interval text not null,
  candle_time timestamptz not null,
  open_price numeric(24, 8) not null,
  high_price numeric(24, 8) not null,
  low_price numeric(24, 8) not null,
  trade_price numeric(24, 8) not null,
  candle_acc_trade_price numeric(28, 8),
  candle_acc_trade_volume numeric(28, 12),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (exchange, market, interval, candle_time)
);

create index if not exists idx_market_candles_lookup
  on market_candles (exchange, market, interval, candle_time desc);
create index if not exists idx_market_candles_created_at
  on market_candles (created_at desc);

create table if not exists market_tickers (
  id uuid primary key default gen_random_uuid(),
  exchange text not null,
  market text not null,
  ticker_time timestamptz not null,
  trade_price numeric(24, 8) not null,
  signed_change_rate numeric(18, 10),
  signed_change_price numeric(24, 8),
  acc_trade_price_24h numeric(28, 8),
  acc_trade_volume_24h numeric(28, 12),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_market_tickers_lookup
  on market_tickers (exchange, market, ticker_time desc);
create index if not exists idx_market_tickers_created_at
  on market_tickers (created_at desc);

create table if not exists market_research (
  id uuid primary key default gen_random_uuid(),
  exchange text not null,
  market text not null,
  interval text not null,
  research_time timestamptz not null default now(),
  summary text not null,
  risk_factors jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_market_research_latest
  on market_research (exchange, market, interval, research_time desc);
create index if not exists idx_market_research_created_at
  on market_research (created_at desc);

create table if not exists ai_research_notes (
  id uuid primary key default gen_random_uuid(),
  research_id uuid references market_research(id) on delete set null,
  provider text not null default 'mock',
  note_type text not null,
  content text not null,
  risk_level text not null default 'medium',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_research_notes_latest
  on ai_research_notes (note_type, created_at desc);
create index if not exists idx_ai_research_notes_research
  on ai_research_notes (research_id);

create table if not exists strategy_signals (
  id uuid primary key default gen_random_uuid(),
  exchange text not null,
  market text not null,
  interval text not null,
  signal text not null check (signal in ('BUY', 'SELL', 'HOLD')),
  confidence numeric(6, 4) not null default 0,
  reason text not null,
  inputs jsonb not null default '{}'::jsonb,
  signal_time timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_strategy_signals_latest
  on strategy_signals (exchange, market, interval, signal_time desc);
create index if not exists idx_strategy_signals_signal
  on strategy_signals (signal, created_at desc);

create table if not exists paper_trades (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references strategy_signals(id) on delete set null,
  exchange text not null,
  market text not null,
  side text not null check (side in ('BUY', 'SELL')),
  status text not null default 'FILLED',
  quantity numeric(28, 12) not null,
  price numeric(24, 8) not null,
  notional_krw numeric(28, 8) not null,
  pnl_krw numeric(28, 8) not null default 0,
  reason text not null,
  executed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_paper_trades_latest
  on paper_trades (exchange, market, executed_at desc);
create index if not exists idx_paper_trades_side
  on paper_trades (side, created_at desc);

create table if not exists risk_logs (
  id uuid primary key default gen_random_uuid(),
  exchange text not null,
  market text not null,
  signal_id uuid references strategy_signals(id) on delete set null,
  decision text not null check (decision in ('ALLOW', 'BLOCK')),
  reason text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_risk_logs_latest
  on risk_logs (exchange, market, created_at desc);
create index if not exists idx_risk_logs_decision
  on risk_logs (decision, created_at desc);

create table if not exists system_jobs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null check (status in ('started', 'success', 'failed', 'skipped')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  details jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_system_jobs_latest
  on system_jobs (job_name, started_at desc);
create index if not exists idx_system_jobs_status
  on system_jobs (status, created_at desc);
