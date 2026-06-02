import test from 'node:test'
import assert from 'node:assert/strict'
import { MockExchangeClient } from '../services/exchange/mockExchange.ts'

test('mock exchange records orders without calling signed network APIs', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (() => {
    throw new Error('mock exchange must not fetch')
  }) as typeof fetch

  try {
    const client = new MockExchangeClient()
    const result = await client.placeOrder({
      clientOrderId: 'test-key',
      market: 'KRW-BTC',
      side: 'BUY',
      type: 'market',
      notionalKrw: 10000
    })

    assert.equal(result.status, 'filled')
    assert.equal(client.orders.length, 1)
    assert.equal(client.orders[0].clientOrderId, 'test-key')
  } finally {
    globalThis.fetch = originalFetch
  }
})
