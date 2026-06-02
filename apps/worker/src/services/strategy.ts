import type { MarketCandle, ResearchSummary, StrategySignal, TradingSignal } from './types'

export function generateStrategySignal(research: ResearchSummary, candles: MarketCandle[]): StrategySignal {
  const ordered = [...candles].sort((a, b) => new Date(a.candle_time).getTime() - new Date(b.candle_time).getTime())
  const recent = ordered.slice(-6)
  const first = recent[0]
  const last = recent[recent.length - 1]
  const changeRate = first && last ? (last.trade_price - first.open_price) / first.open_price : 0
  const hasHighRisk = research.risk_factors.some((item) => item.includes('wide') || item.includes('above 3%'))
  let signal: TradingSignal = 'HOLD'
  let confidence = 0.45
  let reason = 'Insufficient edge after automated research summary.'

  if (!hasHighRisk && changeRate > 0.008) {
    signal = 'BUY'
    confidence = 0.62
    reason = 'Positive short-term momentum with no high-risk volatility flag.'
  } else if (changeRate < -0.008) {
    signal = 'SELL'
    confidence = 0.6
    reason = 'Negative short-term momentum suggests reducing paper exposure.'
  } else if (hasHighRisk) {
    reason = 'Risk summary flagged elevated volatility; hold by default.'
  }

  return {
    exchange: research.exchange,
    market: research.market,
    interval: research.interval,
    signal,
    confidence,
    reason,
    inputs: {
      researchSummary: research.summary,
      riskFactors: research.risk_factors,
      recentChangeRate: changeRate
    }
  }
}

export interface RealTradingClient {
  placeOrder(): Promise<never>
}

export function createDisabledRealTradingClient(): RealTradingClient {
  return {
    async placeOrder(): Promise<never> {
      throw new Error('Real trading is intentionally disabled. Use paper trading only.')
    }
  }
}
