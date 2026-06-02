import { InMemoryRateLimiter } from '../services/exchange/rateLimiter.ts'
import { canReserveIdempotencyKey, type IdempotencyRecord } from '../services/exchange/idempotency.ts'
import type { ExecutionRepository } from '../services/trading/executionEngine.ts'
import type { OrderIntent } from '../services/trading/orderMapper.ts'
import type { TradingEnv } from '../services/types.ts'

export function liveEnv(overrides: TradingEnv = {}): TradingEnv {
  return {
    ENABLE_REAL_TRADING: 'true',
    LIVE_TRADING_CONFIRM: 'true',
    KILL_SWITCH: 'false',
    MAX_TRADE_KRW: '50000',
    PROVIDER_ALLOWLIST_HOSTS: 'api.upbit.com',
    ...overrides
  }
}

export function approvedIntent(overrides: Partial<OrderIntent> = {}): OrderIntent {
  return {
    id: 'intent-1',
    signalId: 'signal-1',
    provider: 'upbit',
    exchange: 'upbit',
    market: 'KRW-BTC',
    side: 'BUY',
    orderType: 'market',
    status: 'APPROVED',
    notionalKrw: 10000,
    idempotencyKey: 'intent:intent-1:KRW-BTC:BUY',
    reason: 'test intent',
    ...overrides
  }
}

export class MemoryRepository implements ExecutionRepository {
  idempotency = new Map<string, IdempotencyRecord>()
  attempts: Record<string, unknown>[] = []
  audits: Record<string, unknown>[] = []
  killSwitch = false

  async getIdempotency(key: string): Promise<IdempotencyRecord | undefined> {
    return this.idempotency.get(key)
  }

  async reserveIdempotency(record: IdempotencyRecord): Promise<{ allowed: boolean; reason: string; existing?: IdempotencyRecord }> {
    const existing = this.idempotency.get(record.key)
    const decision = canReserveIdempotencyKey(existing, record.key)
    if (!decision.allowed) return { ...decision, existing }
    this.idempotency.set(record.key, record)
    return decision
  }

  async markIdempotencyExecuted(key: string): Promise<void> {
    const existing = this.idempotency.get(key)
    this.idempotency.set(key, { key, scope: existing?.scope ?? 'live-order', status: 'EXECUTED', orderIntentId: existing?.orderIntentId })
  }

  async recordAttempt(row: Record<string, unknown>): Promise<void> {
    this.attempts.push(row)
  }

  async recordAudit(row: Record<string, unknown>): Promise<void> {
    this.audits.push(row)
  }

  async getKillSwitchEnabled(): Promise<boolean> {
    return this.killSwitch
  }
}

export function rateLimiter() {
  return new InMemoryRateLimiter()
}
