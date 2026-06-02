import type { MarketCandle, MarketTicker, ResearchSummary, TradingEnv } from './types'

function pct(value: number) {
  return `${(value * 100).toFixed(2)}%`
}

export async function summarizeMarketData(
  env: TradingEnv,
  market: string,
  interval: string,
  candles: MarketCandle[],
  tickers: MarketTicker[]
): Promise<ResearchSummary> {
  const latestTicker = tickers.find((ticker) => ticker.market === market)
  const orderedCandles = [...candles].sort((a, b) => new Date(a.candle_time).getTime() - new Date(b.candle_time).getTime())
  const first = orderedCandles[0]
  const last = orderedCandles[orderedCandles.length - 1]
  const changeRate = first && last ? (last.trade_price - first.open_price) / first.open_price : 0
  const high = Math.max(...orderedCandles.map((item) => item.high_price))
  const low = Math.min(...orderedCandles.map((item) => item.low_price))
  const volatility = last ? (high - low) / last.trade_price : 0
  const riskFactors: string[] = []

  if (Math.abs(changeRate) > 0.03) riskFactors.push('short-term price movement above 3%')
  if (volatility > 0.04) riskFactors.push('wide intraday candle range')
  if ((latestTicker?.signed_change_rate ?? 0) < -0.02) riskFactors.push('negative 24h ticker momentum')
  if (riskFactors.length === 0) riskFactors.push('no major automated risk factor detected')

  const provider = env.AI_API_KEY && env.AI_PROVIDER ? env.AI_PROVIDER : 'mock'
  return {
    exchange: 'upbit',
    market,
    interval,
    summary: `${market} ${interval} mock research: recent candle change ${pct(changeRate)}, range volatility ${pct(volatility)}, latest price ${latestTicker?.trade_price ?? last?.trade_price ?? 'n/a'} KRW. AI is used for summarization only, not direct order decisions.`,
    risk_factors: riskFactors,
    metadata: {
      provider,
      candleCount: candles.length,
      tickerTime: latestTicker?.ticker_time,
      changeRate,
      volatility
    }
  }
}
