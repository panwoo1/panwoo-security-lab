export type RateLimitRule = {
  perSecond: number
  perMinute: number
}

export type RateLimitDecision = {
  allowed: boolean
  reason: string
  details: Record<string, unknown>
}

export interface RateLimiter {
  check(key: string, rule: RateLimitRule, now?: number): Promise<RateLimitDecision> | RateLimitDecision
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, number[]>()

  check(key: string, rule: RateLimitRule, now = Date.now()): RateLimitDecision {
    const windowStartMinute = now - 60_000
    const windowStartSecond = now - 1_000
    const current = (this.hits.get(key) ?? []).filter((value) => value > windowStartMinute)
    const perSecondCount = current.filter((value) => value > windowStartSecond).length

    if (perSecondCount >= rule.perSecond) {
      this.hits.set(key, current)
      return {
        allowed: false,
        reason: 'Per-second rate limit exceeded.',
        details: { key, perSecond: rule.perSecond, perSecondCount }
      }
    }

    if (current.length >= rule.perMinute) {
      this.hits.set(key, current)
      return {
        allowed: false,
        reason: 'Per-minute rate limit exceeded.',
        details: { key, perMinute: rule.perMinute, perMinuteCount: current.length }
      }
    }

    current.push(now)
    this.hits.set(key, current)
    return {
      allowed: true,
      reason: 'Rate limit passed.',
      details: { key, perSecond: rule.perSecond, perMinute: rule.perMinute }
    }
  }
}

export const QUERY_RATE_LIMIT: RateLimitRule = { perSecond: 5, perMinute: 60 }
export const ORDER_RATE_LIMIT: RateLimitRule = { perSecond: 1, perMinute: 5 }

export type RateLimitLogStore = {
  recentAllowed(scope: string, sinceIso: string): Promise<number>
  record(row: { provider: string; operation: string; scope: string; allowed: boolean; reason: string; details: Record<string, unknown> }): Promise<void>
}

export class PersistentRateLimiter implements RateLimiter {
  private readonly store: RateLimitLogStore
  private readonly provider: string
  private readonly operation: string

  constructor(store: RateLimitLogStore, provider: string, operation: string) {
    this.store = store
    this.provider = provider
    this.operation = operation
  }

  async check(scope: string, rule: RateLimitRule, now = Date.now()): Promise<RateLimitDecision> {
    const secondCount = await this.store.recentAllowed(scope, new Date(now - 1_000).toISOString())
    const minuteCount = await this.store.recentAllowed(scope, new Date(now - 60_000).toISOString())
    let decision: RateLimitDecision

    if (secondCount >= rule.perSecond) {
      decision = { allowed: false, reason: 'Per-second persistent rate limit exceeded.', details: { scope, perSecond: rule.perSecond, secondCount } }
    } else if (minuteCount >= rule.perMinute) {
      decision = { allowed: false, reason: 'Per-minute persistent rate limit exceeded.', details: { scope, perMinute: rule.perMinute, minuteCount } }
    } else {
      decision = { allowed: true, reason: 'Persistent rate limit passed.', details: { scope, perSecond: rule.perSecond, perMinute: rule.perMinute } }
    }

    await this.store.record({
      provider: this.provider,
      operation: this.operation,
      scope,
      allowed: decision.allowed,
      reason: decision.reason,
      details: decision.details
    })
    return decision
  }
}

export class SupabaseAtomicRateLimiter implements RateLimiter {
  private readonly env: TradingEnv
  private readonly provider: string
  private readonly operation: string

  constructor(env: TradingEnv, provider: string, operation: string) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for atomic live rate limiting.')
    }
    this.env = env
    this.provider = provider
    this.operation = operation
  }

  async check(scope: string, rule: RateLimitRule): Promise<RateLimitDecision> {
    const [row] = await getWriteDb(this.env).rpc<RateLimitDecision>('consume_trading_rate_limit', {
      p_provider: this.provider,
      p_operation: this.operation,
      p_scope: scope,
      p_per_second: rule.perSecond,
      p_per_minute: rule.perMinute
    })
    return row ?? { allowed: false, reason: 'Rate limit RPC returned no decision.', details: { scope } }
  }
}

export async function withExponentialBackoff<T>(task: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await task()
    } catch (error) {
      lastError = error
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt))
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Backoff task failed')
}
import type { TradingEnv } from '../types.ts'
import { getWriteDb } from '../supabase.ts'
