import test from 'node:test'
import assert from 'node:assert/strict'
import { ORDER_RATE_LIMIT, PersistentRateLimiter, type RateLimitLogStore } from '../services/exchange/rateLimiter.ts'

test('persistent rate limiter blocks from stored per-second counts and records the decision', async () => {
  const records: Array<{ allowed: boolean; reason: string }> = []
  const now = Date.parse('2026-06-02T00:00:00.000Z')
  const store: RateLimitLogStore = {
    async recentAllowed(_scope: string, sinceIso: string) {
      const ageMs = now - new Date(sinceIso).getTime()
      return ageMs <= 1_000 ? ORDER_RATE_LIMIT.perSecond : 0
    },
    async record(row) {
      records.push({ allowed: row.allowed, reason: row.reason })
    }
  }

  const limiter = new PersistentRateLimiter(store, 'upbit', 'order')
  const decision = await limiter.check('upbit:order', ORDER_RATE_LIMIT, now)

  assert.equal(decision.allowed, false)
  assert.match(decision.reason, /Per-second/)
  assert.deepEqual(records, [{ allowed: false, reason: decision.reason }])
})
