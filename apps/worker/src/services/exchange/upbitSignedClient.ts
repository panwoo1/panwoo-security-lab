import { assertProviderHostAllowed } from './hostAllowlist.ts'
import { withExponentialBackoff } from './rateLimiter.ts'
import type { Balance, CancelResult, ExchangeClient, OrderRequest, OrderResult, Ticker } from './types.ts'
import type { TradingEnv } from '../types.ts'

export class UpbitSignedClient implements ExchangeClient {
  private readonly env: TradingEnv
  private readonly baseUrl: string

  constructor(env: TradingEnv, baseUrl = 'https://api.upbit.com') {
    this.env = env
    this.baseUrl = assertProviderHostAllowed('upbit', baseUrl, env.PROVIDER_ALLOWLIST_HOSTS).origin
  }

  async getBalances(): Promise<Balance[]> {
    this.assertLiveRequestAllowed()
    const response = await withExponentialBackoff(() => this.signedFetch('/v1/accounts', 'GET'))
    if (!response.ok) throw new Error(`Upbit balances request failed: ${response.status}`)
    const rows = (await response.json()) as Array<{ currency: string; balance: string; locked: string }>
    return rows.map((row) => ({
      currency: row.currency,
      available: Number(row.balance),
      locked: Number(row.locked)
    }))
  }

  async getTicker(market: string): Promise<Ticker> {
    const url = assertProviderHostAllowed('upbit', `${this.baseUrl}/v1/ticker?markets=${encodeURIComponent(market)}`, this.env.PROVIDER_ALLOWLIST_HOSTS)
    const response = await withExponentialBackoff(() => fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000)
    }))
    if (!response.ok) throw new Error(`Upbit ticker request failed: ${response.status}`)
    const [row] = (await response.json()) as Array<{ market: string; trade_price: number; timestamp: number }>
    return { market: row.market, price: Number(row.trade_price), timestamp: new Date(Number(row.timestamp)).toISOString() }
  }

  async placeOrder(order: OrderRequest): Promise<OrderResult> {
    this.assertLiveRequestAllowed()
    const body = mapOrderRequest(order)
    const response = await this.signedFetch('/v1/orders', 'POST', body)
    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>
    if (!response.ok) throw new Error(`Upbit order request failed: ${response.status}`)
    return {
      orderId: String(raw.uuid ?? raw.identifier ?? order.clientOrderId),
      market: String(raw.market ?? order.market),
      side: order.side,
      status: raw.state === 'done' ? 'filled' : 'accepted',
      filledQuantity: raw.executed_volume ? Number(raw.executed_volume) : undefined,
      averagePrice: raw.price ? Number(raw.price) : undefined,
      raw
    }
  }

  async cancelOrder(orderId: string): Promise<CancelResult> {
    this.assertLiveRequestAllowed()
    const response = await this.signedFetch('/v1/order', 'DELETE', undefined, { uuid: orderId })
    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>
    if (!response.ok && response.status !== 404) throw new Error(`Upbit cancel request failed: ${response.status}`)
    return {
      orderId,
      status: response.status === 404 ? 'not_found' : 'cancelled',
      raw
    }
  }

  private assertLiveRequestAllowed() {
    if (this.env.ENABLE_REAL_TRADING !== 'true' || this.env.LIVE_TRADING_CONFIRM !== 'true') {
      throw new Error('Live trading flags are not enabled.')
    }
    if (this.env.KILL_SWITCH === 'true') {
      throw new Error('Kill switch is enabled.')
    }
    if (!this.env.UPBIT_ACCESS_KEY || !this.env.UPBIT_SECRET_KEY) {
      throw new Error('Upbit API secrets are not configured.')
    }
  }

  private async signedFetch(path: string, method: 'GET' | 'POST' | 'DELETE', body?: Record<string, string>, query?: Record<string, string>): Promise<Response> {
    const url = assertProviderHostAllowed('upbit', `${this.baseUrl}${path}`, this.env.PROVIDER_ALLOWLIST_HOSTS)
    const queryString = query ? toUpbitQueryString(query) : body ? toUpbitQueryString(body) : ''
    if (queryString && method !== 'POST') {
      url.search = queryString
    }

    const token = await createUpbitJwt(this.env.UPBIT_ACCESS_KEY ?? '', this.env.UPBIT_SECRET_KEY ?? '', queryString)
    return fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {})
      },
      body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(8000)
    })
  }
}

function mapOrderRequest(order: OrderRequest): Record<string, string> {
  if (order.type === 'limit') {
    if (!order.quantity || !order.limitPrice) throw new Error('Limit orders require quantity and limitPrice.')
    return {
      market: order.market,
      side: order.side === 'BUY' ? 'bid' : 'ask',
      ord_type: 'limit',
      volume: String(order.quantity),
      price: String(order.limitPrice),
      identifier: order.clientOrderId
    }
  }

  if (order.side === 'BUY') {
    if (!order.notionalKrw) throw new Error('Market BUY orders require notionalKrw.')
    return {
      market: order.market,
      side: 'bid',
      ord_type: 'price',
      price: String(order.notionalKrw),
      identifier: order.clientOrderId
    }
  }

  if (!order.quantity) throw new Error('Market SELL orders require quantity.')
  return {
    market: order.market,
    side: 'ask',
    ord_type: 'market',
    volume: String(order.quantity),
    identifier: order.clientOrderId
  }
}

export function toUpbitQueryString(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

export async function createUpbitJwt(accessKey: string, secretKey: string, queryString = ''): Promise<string> {
  const payload: Record<string, string> = {
    access_key: accessKey,
    nonce: crypto.randomUUID()
  }
  if (queryString) {
    payload.query_hash = await sha512Hex(queryString)
    payload.query_hash_alg = 'SHA512'
  }

  const header = { alg: 'HS512', typ: 'JWT' }
  const signingInput = `${base64UrlJson(header)}.${base64UrlJson(payload)}`
  const signature = await hmacSha512(signingInput, secretKey)
  return `${signingInput}.${base64UrlBytes(signature)}`
}

function base64UrlJson(value: unknown): string {
  return base64UrlBytes(new TextEncoder().encode(JSON.stringify(value)))
}

function base64UrlBytes(bytes: Uint8Array | ArrayBuffer): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  array.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function sha512Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function hmacSha512(value: string, secretKey: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretKey),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
}
