import test from 'node:test'
import assert from 'node:assert/strict'
import { createUpbitJwt, sha512Hex, toUpbitQueryString, UpbitSignedClient } from '../services/exchange/upbitSignedClient.ts'
import { liveEnv } from './testSupport.ts'

test('upbit signed placeOrder builds a guarded authenticated request without retrying failed orders', async () => {
  const calls: Request[] = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(new Request(input, init))
    return Response.json({ uuid: 'upbit-order-1', market: 'KRW-BTC', state: 'wait' })
  }) as typeof fetch

  try {
    const client = new UpbitSignedClient(liveEnv({
      UPBIT_ACCESS_KEY: 'test-access',
      UPBIT_SECRET_KEY: 'test-secret',
      PROVIDER_ALLOWLIST_HOSTS: 'api.upbit.com'
    }))
    const result = await client.placeOrder({
      clientOrderId: 'intent:intent-1:KRW-BTC:BUY',
      market: 'KRW-BTC',
      side: 'BUY',
      type: 'market',
      notionalKrw: 10000
    })

    assert.equal(result.orderId, 'upbit-order-1')
    assert.equal(calls.length, 1)
    assert.equal(calls[0].method, 'POST')
    assert.equal(new URL(calls[0].url).hostname, 'api.upbit.com')
    assert.match(calls[0].headers.get('Authorization') ?? '', /^Bearer .+\..+\..+$/)
    assert.deepEqual(await calls[0].json(), {
      market: 'KRW-BTC',
      side: 'bid',
      ord_type: 'price',
      price: '10000',
      identifier: 'intent:intent-1:KRW-BTC:BUY'
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('upbit query string and JWT payload include SHA512 query hash', async () => {
  const queryString = toUpbitQueryString({
    market: 'KRW-BTC',
    side: 'bid',
    ord_type: 'price',
    price: '10000',
    identifier: 'intent:intent-1:KRW-BTC:BUY'
  })
  const expectedHash = await sha512Hex(queryString)
  const token = await createUpbitJwt('access-key', 'secret-key', queryString)
  const payload = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as Record<string, string>

  assert.equal(queryString, 'market=KRW-BTC&side=bid&ord_type=price&price=10000&identifier=intent%3Aintent-1%3AKRW-BTC%3ABUY')
  assert.equal(payload.query_hash, expectedHash)
  assert.equal(payload.query_hash_alg, 'SHA512')
  assert.equal(payload.access_key, 'access-key')
})

test('upbit signed placeOrder does not retry a failed non-idempotent request', async () => {
  let calls = 0
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    calls += 1
    return Response.json({ error: 'failed' }, { status: 500 })
  }) as typeof fetch

  try {
    const client = new UpbitSignedClient(liveEnv({
      UPBIT_ACCESS_KEY: 'test-access',
      UPBIT_SECRET_KEY: 'test-secret',
      PROVIDER_ALLOWLIST_HOSTS: 'api.upbit.com'
    }))
    await assert.rejects(() => client.placeOrder({
      clientOrderId: 'intent:intent-1:KRW-BTC:BUY',
      market: 'KRW-BTC',
      side: 'BUY',
      type: 'market',
      notionalKrw: 10000
    }), /failed: 500/)
    assert.equal(calls, 1)
  } finally {
    globalThis.fetch = originalFetch
  }
})
