import type { PaperTrade, StrategySignal, TradingEnv } from './types'

export type RiskDecision = {
  allowed: boolean
  reason: string
  details: Record<string, unknown>
}

function numberEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function getRiskConfig(env: TradingEnv) {
  return {
    enableRealTrading: env.ENABLE_REAL_TRADING === 'true',
    orderKrw: numberEnv(env.TRADING_ORDER_KRW, 10000),
    maxTradeKrw: numberEnv(env.MAX_TRADE_KRW, 50000),
    dailyMaxTrades: Math.floor(numberEnv(env.DAILY_MAX_TRADES, 8)),
    dailyMaxLossRate: numberEnv(env.DAILY_MAX_LOSS_RATE, 0.03)
  }
}

export function evaluatePaperTradeRisk(
  env: TradingEnv,
  signal: StrategySignal,
  todayTrades: PaperTrade[],
  latestMarketTrades: PaperTrade[]
): RiskDecision {
  const config = getRiskConfig(env)
  const notional = Math.min(config.orderKrw, config.maxTradeKrw)
  const dailyPnl = todayTrades.reduce((total, trade) => total + Number(trade.pnl_krw ?? 0), 0)
  const dailyLossRate = dailyPnl < 0 ? Math.abs(dailyPnl) / Math.max(config.maxTradeKrw, 1) : 0
  const latest = latestMarketTrades[0]

  if (config.enableRealTrading) {
    return {
      allowed: false,
      reason: 'ENABLE_REAL_TRADING must remain false for this paper-trading workflow.',
      details: { config }
    }
  }

  if (signal.signal === 'HOLD') {
    return {
      allowed: false,
      reason: 'HOLD signal does not create a paper trade.',
      details: { signal: signal.signal }
    }
  }

  if (notional > config.maxTradeKrw) {
    return {
      allowed: false,
      reason: 'Requested paper trade exceeds max trade KRW.',
      details: { notional, maxTradeKrw: config.maxTradeKrw }
    }
  }

  if (todayTrades.length >= config.dailyMaxTrades) {
    return {
      allowed: false,
      reason: 'Daily paper trade count limit reached.',
      details: { todayTrades: todayTrades.length, dailyMaxTrades: config.dailyMaxTrades }
    }
  }

  if (dailyLossRate >= config.dailyMaxLossRate) {
    return {
      allowed: false,
      reason: 'Daily paper loss rate limit reached.',
      details: { dailyPnl, dailyLossRate, dailyMaxLossRate: config.dailyMaxLossRate }
    }
  }

  if (latest?.side === 'BUY' && signal.signal === 'BUY') {
    return {
      allowed: false,
      reason: 'Consecutive entry into the same market is blocked.',
      details: { latestTradeId: latest.id, latestSide: latest.side }
    }
  }

  return {
    allowed: true,
    reason: 'Paper trade risk checks passed.',
    details: { notional, config }
  }
}
