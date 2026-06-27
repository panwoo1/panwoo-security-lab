import type { PaperTrade, StrategySignal, TradingEnv } from './types'

export type RiskDecision = {
  allowed: boolean
  reason: string
  details: Record<string, unknown>
}

export type AutoApprovalPolicy = {
  minConfidence: number
  allowedSignals: Array<'BUY' | 'SELL'>
  maxNotionalKrw: number
  requirePaperRiskPass: boolean
}

export type AutoApprovalSimulation = {
  signalId?: string
  market: string
  signal: StrategySignal['signal']
  confidence: number
  wouldApprove: boolean
  reason: string
  notionalKrw: number
  signalTime?: string
  riskDecision: RiskDecision
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

export function getAutoApprovalPolicy(env: TradingEnv): AutoApprovalPolicy {
  const config = getRiskConfig(env)
  const allowedSignals = (env.AUTO_APPROVAL_SIGNALS || 'BUY,SELL')
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is 'BUY' | 'SELL' => item === 'BUY' || item === 'SELL')

  return {
    minConfidence: Math.min(numberEnv(env.AUTO_APPROVAL_MIN_CONFIDENCE, 0.7), 1),
    allowedSignals: allowedSignals.length > 0 ? allowedSignals : ['BUY', 'SELL'],
    maxNotionalKrw: Math.min(config.orderKrw, config.maxTradeKrw),
    requirePaperRiskPass: true
  }
}

export function simulateAutoApproval(
  env: TradingEnv,
  signal: StrategySignal,
  todayTrades: PaperTrade[],
  latestMarketTrades: PaperTrade[]
): AutoApprovalSimulation {
  const policy = getAutoApprovalPolicy(env)
  const riskDecision = evaluatePaperTradeRisk({ ...env, ENABLE_REAL_TRADING: 'false' }, signal, todayTrades, latestMarketTrades)
  const confidence = Number(signal.confidence ?? 0)

  if (signal.signal === 'HOLD') {
    return {
      signalId: signal.id,
      market: signal.market,
      signal: signal.signal,
      confidence,
      wouldApprove: false,
      reason: 'HOLD signals are never auto-approved.',
      notionalKrw: policy.maxNotionalKrw,
      signalTime: signal.signal_time,
      riskDecision
    }
  }

  if (!policy.allowedSignals.includes(signal.signal)) {
    return {
      signalId: signal.id,
      market: signal.market,
      signal: signal.signal,
      confidence,
      wouldApprove: false,
      reason: `${signal.signal} is not allowed by the simulated policy.`,
      notionalKrw: policy.maxNotionalKrw,
      signalTime: signal.signal_time,
      riskDecision
    }
  }

  if (confidence < policy.minConfidence) {
    return {
      signalId: signal.id,
      market: signal.market,
      signal: signal.signal,
      confidence,
      wouldApprove: false,
      reason: 'Signal confidence is below the auto-approval threshold.',
      notionalKrw: policy.maxNotionalKrw,
      signalTime: signal.signal_time,
      riskDecision
    }
  }

  if (!riskDecision.allowed) {
    return {
      signalId: signal.id,
      market: signal.market,
      signal: signal.signal,
      confidence,
      wouldApprove: false,
      reason: riskDecision.reason,
      notionalKrw: policy.maxNotionalKrw,
      signalTime: signal.signal_time,
      riskDecision
    }
  }

  return {
    signalId: signal.id,
    market: signal.market,
    signal: signal.signal,
    confidence,
    wouldApprove: true,
    reason: 'Signal would pass the simulated auto-approval policy.',
    notionalKrw: policy.maxNotionalKrw,
    signalTime: signal.signal_time,
    riskDecision
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
