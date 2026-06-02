import type { TradingEnv } from './types'

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'

export async function getCoinGeckoMarketData(env: TradingEnv, ids = 'bitcoin,ethereum,ripple') {
  const url = new URL('/coins/markets', COINGECKO_BASE_URL)
  url.searchParams.set('vs_currency', 'krw')
  url.searchParams.set('ids', ids)
  url.searchParams.set('price_change_percentage', '24h')

  const headers: HeadersInit = { Accept: 'application/json' }
  if (env.COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = env.COINGECKO_API_KEY

  let response: Response | null = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(6000)
    })

    if (response.ok || (response.status !== 429 && response.status < 500)) break
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
  }

  if (!response?.ok) {
    throw new Error(`CoinGecko request failed: ${response?.status ?? 'unknown'}`)
  }

  return (await response.json()) as Array<Record<string, unknown>>
}
