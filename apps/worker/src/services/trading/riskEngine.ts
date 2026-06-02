import type { TradingEnv } from '../types.ts'
import type { OrderIntent } from './orderMapper.ts'

export type LiveRiskDecision = {
  allowed: boolean
  reason: string
  details: Record<string, unknown>
}

function positiveNumber(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function evaluateLiveOrderRisk(env: TradingEnv, intent: OrderIntent): LiveRiskDecision {
  const maxTradeKrw = Number(env.MAX_TRADE_KRW || 50_000)
  const notional = intent.notionalKrw ?? 0

  if (!['BUY', 'SELL'].includes(intent.side)) {
    return { allowed: false, reason: 'Unsupported order side.', details: { side: intent.side } }
  }

  if (intent.side === 'BUY' && (!positiveNumber(notional) || notional > maxTradeKrw)) {
    return { allowed: false, reason: 'Live BUY notional is invalid or exceeds max trade KRW.', details: { notional, maxTradeKrw } }
  }

  if (intent.side === 'SELL' && !positiveNumber(intent.quantity)) {
    return { allowed: false, reason: 'Live SELL quantity is required.', details: { quantity: intent.quantity } }
  }

  return { allowed: true, reason: 'Live risk checks passed.', details: { maxTradeKrw, notional } }
}
