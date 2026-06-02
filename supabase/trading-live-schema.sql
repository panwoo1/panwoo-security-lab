create extension if not exists pgcrypto;

create table if not exists exchange_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  account_label text not null,
  mode text not null default 'paper' check (mode in ('paper', 'sandbox', 'live')),
  status text not null default 'disabled' check (status in ('enabled', 'disabled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, account_label)
);

create table if not exists order_intents (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references strategy_signals(id) on delete set null,
  provider text not null,
  exchange text not null,
  market text not null,
  side text not null check (side in ('BUY', 'SELL')),
  order_type text not null default 'market',
  status text not null check (status in ('CREATED', 'RISK_CHECKED', 'WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'EXECUTION_REQUESTED', 'EXECUTED', 'FAILED', 'BLOCKED')),
  quantity numeric(28, 12),
  notional_krw numeric(28, 8),
  limit_price numeric(24, 8),
  idempotency_key text not null,
  reason text not null,
  risk_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create index if not exists idx_order_intents_market_status
  on order_intents (market, side, status, created_at desc);
create index if not exists idx_order_intents_idempotency
  on order_intents (idempotency_key, status);
create index if not exists idx_order_intents_signal
  on order_intents (signal_id);

create table if not exists order_approvals (
  id uuid primary key default gen_random_uuid(),
  order_intent_id uuid not null references order_intents(id) on delete cascade,
  status text not null check (status in ('APPROVED', 'REJECTED')),
  approved_by text not null default 'admin',
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_order_approvals_intent
  on order_approvals (order_intent_id, status, created_at desc);

create table if not exists order_attempts (
  id uuid primary key default gen_random_uuid(),
  order_intent_id uuid not null references order_intents(id) on delete cascade,
  provider text not null,
  market text not null,
  side text not null check (side in ('BUY', 'SELL')),
  status text not null check (status in ('REQUESTED', 'BLOCKED', 'FAILED', 'EXECUTED')),
  idempotency_key text not null,
  request_hash text,
  response jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_order_attempts_lookup
  on order_attempts (market, side, status, idempotency_key, created_at desc);
create index if not exists idx_order_attempts_intent
  on order_attempts (order_intent_id, created_at desc);

create table if not exists executed_orders (
  id uuid primary key default gen_random_uuid(),
  order_intent_id uuid not null references order_intents(id) on delete restrict,
  provider text not null,
  exchange_order_id text not null,
  market text not null,
  side text not null check (side in ('BUY', 'SELL')),
  status text not null,
  idempotency_key text not null,
  filled_quantity numeric(28, 12),
  average_price numeric(24, 8),
  notional_krw numeric(28, 8),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, exchange_order_id),
  unique (idempotency_key)
);

create index if not exists idx_executed_orders_lookup
  on executed_orders (market, side, status, idempotency_key, created_at desc);
create index if not exists idx_executed_orders_intent
  on executed_orders (order_intent_id);

create table if not exists idempotency_keys (
  key text primary key,
  scope text not null,
  status text not null check (status in ('RESERVED', 'EXECUTED', 'FAILED', 'EXPIRED')),
  order_intent_id uuid references order_intents(id) on delete set null,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_idempotency_keys_status
  on idempotency_keys (status, updated_at desc);

create table if not exists kill_switch_state (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'global',
  enabled boolean not null default false,
  reason text,
  changed_by text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scope)
);

create table if not exists trading_audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  provider text,
  market text,
  side text,
  order_intent_id uuid references order_intents(id) on delete set null,
  idempotency_key text,
  decision text not null,
  reason text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_trading_audit_logs_lookup
  on trading_audit_logs (event_type, decision, created_at desc);
create index if not exists idx_trading_audit_logs_order
  on trading_audit_logs (order_intent_id, created_at desc);

create table if not exists provider_allowlist (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  host text not null,
  purpose text not null default 'signed-api',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, host, purpose)
);

create index if not exists idx_provider_allowlist_provider
  on provider_allowlist (provider, enabled);

create table if not exists rate_limit_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  operation text not null,
  scope text not null,
  allowed boolean not null,
  reason text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_logs_lookup
  on rate_limit_logs (provider, operation, allowed, created_at desc);

create or replace function consume_trading_rate_limit(
  p_provider text,
  p_operation text,
  p_scope text,
  p_per_second integer,
  p_per_minute integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  second_count integer;
  minute_count integer;
  allowed_result boolean;
  reason_result text;
  details_result jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('trading-rate-limit:' || p_scope));

  select count(*) into second_count
  from rate_limit_logs
  where scope = p_scope
    and allowed = true
    and created_at >= now() - interval '1 second';

  select count(*) into minute_count
  from rate_limit_logs
  where scope = p_scope
    and allowed = true
    and created_at >= now() - interval '1 minute';

  if second_count >= p_per_second then
    allowed_result := false;
    reason_result := 'Per-second atomic rate limit exceeded.';
  elsif minute_count >= p_per_minute then
    allowed_result := false;
    reason_result := 'Per-minute atomic rate limit exceeded.';
  else
    allowed_result := true;
    reason_result := 'Atomic rate limit passed.';
  end if;

  details_result := jsonb_build_object(
    'scope', p_scope,
    'perSecond', p_per_second,
    'perMinute', p_per_minute,
    'secondCount', second_count,
    'minuteCount', minute_count
  );

  insert into rate_limit_logs (provider, operation, scope, allowed, reason, details)
  values (p_provider, p_operation, p_scope, allowed_result, reason_result, details_result);

  return jsonb_build_object(
    'allowed', allowed_result,
    'reason', reason_result,
    'details', details_result
  );
end;
$$;

revoke all on function consume_trading_rate_limit(text, text, text, integer, integer) from public;
revoke all on function consume_trading_rate_limit(text, text, text, integer, integer) from anon;
revoke all on function consume_trading_rate_limit(text, text, text, integer, integer) from authenticated;
grant execute on function consume_trading_rate_limit(text, text, text, integer, integer) to service_role;

alter table exchange_accounts enable row level security;
alter table order_intents enable row level security;
alter table order_approvals enable row level security;
alter table order_attempts enable row level security;
alter table executed_orders enable row level security;
alter table idempotency_keys enable row level security;
alter table kill_switch_state enable row level security;
alter table trading_audit_logs enable row level security;
alter table provider_allowlist enable row level security;
alter table rate_limit_logs enable row level security;

revoke all on table exchange_accounts from anon;
revoke all on table order_intents from anon;
revoke all on table order_approvals from anon;
revoke all on table order_attempts from anon;
revoke all on table executed_orders from anon;
revoke all on table idempotency_keys from anon;
revoke all on table kill_switch_state from anon;
revoke all on table trading_audit_logs from anon;
revoke all on table provider_allowlist from anon;
revoke all on table rate_limit_logs from anon;

-- Live trading tables are Worker-admin only by default. Supabase service_role
-- bypasses RLS for server-side Worker calls; do not expose that key to clients.
-- Add narrower authenticated/operator policies only after defining operator auth.
