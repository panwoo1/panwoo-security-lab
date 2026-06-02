import test from 'node:test'
import assert from 'node:assert/strict'
import { MockExchangeClient } from '../services/exchange/mockExchange.ts'
import { executeLiveOrder } from '../services/trading/executionEngine.ts'
import { approvedIntent, liveEnv, MemoryRepository, rateLimiter } from './testSupport.ts'

test('env kill switch blocks all order execution', async () => {
  const client = new MockExchangeClient()
  const result = await executeLiveOrder({
    env: liveEnv({ KILL_SWITCH: 'true' }),
    intent: approvedIntent(),
    client,
    repository: new MemoryRepository(),
    rateLimiter: rateLimiter()
  })

  assert.equal(result.executed, false)
  assert.equal(client.orders.length, 0)
  assert.match(result.reason, /Kill switch/)
})

test('persisted kill switch blocks all order execution', async () => {
  const repository = new MemoryRepository()
  repository.killSwitch = true
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
  assert.match(result.reason, /Kill switch/)
})
