import type { MarketCandle, MarketTicker } from './types'

const UPBIT_BASE_URL = 'https://api.upbit.com'
const INTERVAL_PATHS: Record<string, string> = {
  minutes1: '/v1/candles/minutes/1',
  minutes3: '/v1/candles/minutes/3',
  minutes5: '/v1/candles/minutes/5',
  minutes10: '/v1/candles/minutes/10',
  minutes15: '/v1/candles/minutes/15',
  minutes30: '/v1/candles/minutes/30',
  minutes60: '/v1/candles/minutes/60',
  minutes240: '/v1/candles/minutes/240',
  days: '/v1/candles/days'
}

async function fetchJsonWithBackoff<T>(url: URL, attempts = 3): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000)
      })

      if (response.ok) return (await response.json()) as T
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`Upbit request failed: ${response.status}`)
      }
      lastError = new Error(`Upbit retryable status: ${response.status}`)
    } catch (error) {
      lastError = error
    }

    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
  }

  throw lastError instanceof Error ? lastError : new Error('Upbit request failed')
}

export function parseMarkets(value?: string): string[] {
  return (value ?? 'KRW-BTC,KRW-ETH,KRW-XRP')
    .split(',')
    .map((market) => market.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 8)
}

export async function getUpbitTickers(markets: string[]): Promise<MarketTicker[]> {
  if (markets.length === 0) return []

  const url = new URL('/v1/ticker', UPBIT_BASE_URL)
  url.searchParams.set('markets', markets.join(','))

  const rows = await fetchJsonWithBackoff<Array<Record<string, number | string>>>(url)
  return rows.map((row) => ({
    exchange: 'upbit',
    market: String(row.market),
    ticker_time: new Date(Number(row.timestamp)).toISOString(),
    trade_price: Number(row.trade_price),
    signed_change_rate: Number(row.signed_change_rate),
    signed_change_price: Number(row.signed_change_price),
    acc_trade_price_24h: Number(row.acc_trade_price_24h),
    acc_trade_volume_24h: Number(row.acc_trade_volume_24h),
    raw: row
  }))
}

export async function getUpbitCandles(market: string, interval = 'minutes5', count = 20): Promise<MarketCandle[]> {
  const path = INTERVAL_PATHS[interval]
  if (!path) throw new Error(`Unsupported candle interval: ${interval}`)

  const url = new URL(path, UPBIT_BASE_URL)
  url.searchParams.set('market', market)
  url.searchParams.set('count', String(Math.min(Math.max(count, 1), 200)))

  const rows = await fetchJsonWithBackoff<Array<Record<string, number | string>>>(url)
  return rows.map((row) => ({
    exchange: 'upbit',
    market,
    interval,
    candle_time: new Date(String(row.candle_date_time_utc)).toISOString(),
    open_price: Number(row.opening_price),
    high_price: Number(row.high_price),
    low_price: Number(row.low_price),
    trade_price: Number(row.trade_price),
    candle_acc_trade_price: Number(row.candle_acc_trade_price),
    candle_acc_trade_volume: Number(row.candle_acc_trade_volume),
    raw: row
  }))
}
