import test from 'node:test'
import assert from 'node:assert/strict'
import { assertProviderHostAllowed } from '../services/exchange/hostAllowlist.ts'
import { UpbitSignedClient } from '../services/exchange/upbitSignedClient.ts'
import { MockExchangeClient } from '../services/exchange/mockExchange.ts'
import { executeLiveOrder } from '../services/trading/executionEngine.ts'
import { approvedIntent, liveEnv, MemoryRepository, rateLimiter } from './testSupport.ts'

test('provider allowlist rejects non-approved signed API hosts', () => {
  assert.throws(() => assertProviderHostAllowed('upbit', 'https://evil.example/orders', 'api.upbit.com'), /not allowlisted/)
})

test('upbit signed client refuses placeOrder without both live flags', async () => {
  const client = new UpbitSignedClient({ ENABLE_REAL_TRADING: 'true', LIVE_TRADING_CONFIRM: 'false', PROVIDER_ALLOWLIST_HOSTS: 'api.upbit.com' })

  await assert.rejects(() => client.placeOrder({
    clientOrderId: 'k1',
    market: 'KRW-BTC',
    side: 'BUY',
    type: 'market',
    notionalKrw: 10000
  }), /Live trading flags/)
})

test('approved mock path can execute only when every guard passes', async () => {
  const client = new MockExchangeClient()
  const result = await executeLiveOrder({
    env: liveEnv(),
    intent: approvedIntent(),
    client,
    repository: new MemoryRepository(),
    rateLimiter: rateLimiter()
  })

  assert.equal(result.executed, true)
  assert.equal(client.orders.length, 1)
})
