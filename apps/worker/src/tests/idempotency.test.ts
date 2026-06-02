import test from 'node:test'
import assert from 'node:assert/strict'
import { canReserveIdempotencyKey, makeOrderIdempotencyKey } from '../services/exchange/idempotency.ts'
import { MockExchangeClient } from '../services/exchange/mockExchange.ts'
import { executeLiveOrder } from '../services/trading/executionEngine.ts'
import { approvedIntent, liveEnv, MemoryRepository, rateLimiter } from './testSupport.ts'

test('idempotency key generation is stable for the same order intent', () => {
  const key = makeOrderIdempotencyKey({ orderIntentId: 'intent-1', market: 'KRW-BTC', side: 'BUY' })
  assert.equal(key, 'intent:intent-1:KRW-BTC:BUY')
})

test('already executed idempotency key is not reusable', () => {
  const decision = canReserveIdempotencyKey({ key: 'k1', scope: 'live-order', status: 'EXECUTED' }, 'k1')
  assert.equal(decision.allowed, false)
})

test('failed idempotency key requires manual review instead of automatic retry', () => {
  const decision = canReserveIdempotencyKey({ key: 'k1', scope: 'live-order', status: 'FAILED' }, 'k1')
  assert.equal(decision.allowed, false)
  assert.match(decision.reason, /manual review/)
})

test('same executed idempotency key does not place a duplicate order', async () => {
  const repository = new MemoryRepository()
  repository.idempotency.set('intent:intent-1:KRW-BTC:BUY', {
    key: 'intent:intent-1:KRW-BTC:BUY',
    scope: 'live-order',
    status: 'EXECUTED',
    orderIntentId: 'intent-1'
  })
  const client = new MockExchangeClient()
  const result = await executeLiveOrder({
    env: liveEnv(),
    intent: approvedIntent(),
    client,
    repository,
    rateLimiter: rateLimiter()
  })

  assert.equal(result.executed, false)
  assert.equal(client.orders.length, 0)
  assert.match(result.reason, /already executed/)
})
