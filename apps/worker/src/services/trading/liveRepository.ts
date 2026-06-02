import { getWriteDb } from '../supabase.ts'
import type { TradingEnv } from '../types.ts'
import type { IdempotencyRecord } from '../exchange/idempotency.ts'
import { SupabaseAtomicRateLimiter } from '../exchange/rateLimiter.ts'
import type { ExecutionRepository } from './executionEngine.ts'

export class SupabaseExecutionRepository implements ExecutionRepository {
  private readonly env: TradingEnv

  constructor(env: TradingEnv) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for live execution repository.')
    }
    this.env = env
  }

  async getIdempotency(key: string): Promise<IdempotencyRecord | undefined> {
    const [row] = await getWriteDb(this.env).select<{ key: string; scope: string; status: IdempotencyRecord['status']; order_intent_id?: string }>('idempotency_keys', {
      select: '*',
      filters: { key: `eq.${key}` },
      limit: 1
    })
    if (!row) return undefined
    return {
      key: row.key,
      scope: row.scope,
      status: row.status,
      orderIntentId: row.order_intent_id
    }
  }

  async reserveIdempotency(record: IdempotencyRecord): Promise<{ allowed: boolean; reason: string; existing?: IdempotencyRecord }> {
    try {
      await getWriteDb(this.env).insert('idempotency_keys', [
        {
          key: record.key,
          scope: record.scope,
          status: record.status,
          order_intent_id: record.orderIntentId,
          updated_at: new Date().toISOString()
        }
      ], false)
      return { allowed: true, reason: 'Idempotency key reserved atomically.' }
    } catch {
      const existing = await this.getIdempotency(record.key)
      return {
        allowed: false,
        reason: existing?.status === 'EXECUTED' ? 'Idempotency key already executed.' : 'Idempotency key already exists.',
        existing
      }
    }
  }

  async markIdempotencyExecuted(key: string): Promise<void> {
    await getWriteDb(this.env).update('idempotency_keys', { status: 'EXECUTED' }, { key: `eq.${key}` }, false)
  }

  async recordAttempt(row: Record<string, unknown>): Promise<void> {
    await getWriteDb(this.env).insert('order_attempts', [row], false)
  }

  async recordExecutedOrder(row: Record<string, unknown>): Promise<void> {
    await getWriteDb(this.env).insert('executed_orders', [row], false)
  }

  async recordAudit(row: Record<string, unknown>): Promise<void> {
    await getWriteDb(this.env).insert('trading_audit_logs', [row], false)
  }

  async getKillSwitchEnabled(): Promise<boolean> {
    const [row] = await getWriteDb(this.env).select<{ enabled?: boolean }>('kill_switch_state', {
      select: 'enabled',
      filters: { scope: 'eq.global' },
      limit: 1
    })
    return row?.enabled === true
  }
}

export function createSupabaseLiveExecutionContext(env: TradingEnv) {
  return {
    repository: new SupabaseExecutionRepository(env),
    rateLimiter: new SupabaseAtomicRateLimiter(env, 'upbit', 'order')
  }
}
