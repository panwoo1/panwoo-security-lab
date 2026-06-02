import test from 'node:test'
import assert from 'node:assert/strict'
import { MockExchangeClient } from '../services/exchange/mockExchange.ts'
import { executeLiveOrder } from '../services/trading/executionEngine.ts'
import { approvedIntent, liveEnv, MemoryRepository, rateLimiter } from './testSupport.ts'

test('live flag false blocks order execution', async () => {
  const client = new MockExchangeClient()
  const result = await executeLiveOrder({
    env: liveEnv({ ENABLE_REAL_TRADING: 'false' }),
    intent: approvedIntent(),
    client,
    repository: new MemoryRepository(),
    rateLimiter: rateLimiter()
  })

  assert.equal(result.executed, false)
  assert.equal(client.orders.length, 0)
  assert.match(result.reason, /ENABLE_REAL_TRADING/)
})

test('missing LIVE_TRADING_CONFIRM blocks order execution', async () => {
  const client = new MockExchangeClient()
  const result = await executeLiveOrder({
    env: liveEnv({ LIVE_TRADING_CONFIRM: 'false' }),
    intent: approvedIntent(),
    client,
    repository: new MemoryRepository(),
    rateLimiter: rateLimiter()
  })

  assert.equal(result.executed, false)
  assert.equal(client.orders.length, 0)
  assert.match(result.reason, /LIVE_TRADING_CONFIRM/)
})

test('missing manual approval blocks order execution', async () => {
  const client = new MockExchangeClient()
  const result = await executeLiveOrder({
    env: liveEnv(),
    intent: approvedIntent({ status: 'WAITING_APPROVAL' }),
    client,
    repository: new MemoryRepository(),
    rateLimiter: rateLimiter()
  })

  assert.equal(result.executed, false)
  assert.equal(client.orders.length, 0)
  assert.match(result.reason, /approved/)
})

test('rate limit excess blocks order execution and records audit', async () => {
  const limiter = rateLimiter()
  const repository = new MemoryRepository()
  const first = new MockExchangeClient()
  const second = new MockExchangeClient()

  await executeLiveOrder({
    env: liveEnv(),
    intent: approvedIntent({ id: 'intent-1', idempotencyKey: 'intent:intent-1:KRW-BTC:BUY' }),
    client: first,
    repository,
    rateLimiter: limiter
  })
  const result = await executeLiveOrder({
    env: liveEnv(),
    intent: approvedIntent({ id: 'intent-2', idempotencyKey: 'intent:intent-2:KRW-BTC:BUY' }),
    client: second,
    repository,
    rateLimiter: limiter
  })

  assert.equal(result.executed, false)
  assert.equal(second.orders.length, 0)
  assert.match(result.reason, /rate limit/i)
  assert.equal(repository.audits.some((row) => row.event_type === 'rate_limit'), true)
})
