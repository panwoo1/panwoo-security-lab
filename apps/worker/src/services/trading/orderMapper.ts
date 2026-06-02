import { makeOrderIdempotencyKey } from '../exchange/idempotency.ts'
import type { OrderRequest, OrderSide, OrderType } from '../exchange/types.ts'
import type { StrategySignal, TradingSignal } from '../types.ts'

export type OrderIntentStatus = 'CREATED' | 'RISK_CHECKED' | 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTION_REQUESTED' | 'EXECUTED' | 'FAILED' | 'BLOCKED'

export type OrderIntent = {
  id?: string
  signalId?: string
  provider: string
  exchange: string
  market: string
  side: OrderSide
  orderType: OrderType
  status: OrderIntentStatus
  quantity?: number
  notionalKrw?: number
  limitPrice?: number
  idempotencyKey: string
  reason: string
}

export function signalToOrderIntent(signal: StrategySignal, notionalKrw: number): OrderIntent | null {
  if (!isExecutableSignal(signal.signal)) return null
  const side = signal.signal
  return {
    signalId: signal.id,
    provider: signal.exchange,
    exchange: signal.exchange,
    market: signal.market,
    side,
    orderType: 'market',
    status: 'CREATED',
    notionalKrw: side === 'BUY' ? notionalKrw : undefined,
    idempotencyKey: makeOrderIdempotencyKey({ signalId: signal.id, market: signal.market, side }),
    reason: signal.reason
  }
}

export function intentToOrderRequest(intent: OrderIntent): OrderRequest {
  return {
    clientOrderId: intent.idempotencyKey,
    market: intent.market,
    side: intent.side,
    type: intent.orderType,
    quantity: intent.quantity,
    notionalKrw: intent.notionalKrw,
    limitPrice: intent.limitPrice
  }
}

function isExecutableSignal(signal: TradingSignal): signal is OrderSide {
  return signal === 'BUY' || signal === 'SELL'
}
