import { assertProviderHostAllowed } from '../exchange/hostAllowlist.ts'
import type { IdempotencyRecord } from '../exchange/idempotency.ts'
import { ORDER_RATE_LIMIT, type RateLimiter } from '../exchange/rateLimiter.ts'
import type { ExchangeClient, OrderResult } from '../exchange/types.ts'
import type { TradingEnv } from '../types.ts'
import { hasManualApproval } from './approvalGate.ts'
import { isKillSwitchEnabled } from './killSwitch.ts'
import { intentToOrderRequest, type OrderIntent } from './orderMapper.ts'
import { evaluateLiveOrderRisk } from './riskEngine.ts'

export type ExecutionRepository = {
  getIdempotency(key: string): Promise<IdempotencyRecord | undefined>
  reserveIdempotency(record: IdempotencyRecord): Promise<{ allowed: boolean; reason: string; existing?: IdempotencyRecord }>
  markIdempotencyExecuted(key: string): Promise<void>
  recordAttempt(row: Record<string, unknown>): Promise<void>
  recordExecutedOrder?(row: Record<string, unknown>): Promise<void>
  recordAudit(row: Record<string, unknown>): Promise<void>
  getKillSwitchEnabled(): Promise<boolean>
}

export type ExecuteOrderInput = {
  env: TradingEnv
  intent: OrderIntent
  client: ExchangeClient
  repository: ExecutionRepository
  rateLimiter: RateLimiter
  providerBaseUrl?: string
}

export type ExecuteOrderResult = {
  executed: boolean
  reason: string
  order?: OrderResult
}

export async function executeLiveOrder(input: ExecuteOrderInput): Promise<ExecuteOrderResult> {
  const { env, intent, repository } = input

  const block = async (reason: string, details: Record<string, unknown> = {}): Promise<ExecuteOrderResult> => {
    await repository.recordAttempt({ order_intent_id: intent.id, provider: intent.provider, market: intent.market, side: intent.side, status: 'BLOCKED', idempotency_key: intent.idempotencyKey, error: reason, response: details })
    await repository.recordAudit({ event_type: 'live_order_guard', provider: intent.provider, market: intent.market, side: intent.side, order_intent_id: intent.id, idempotency_key: intent.idempotencyKey, decision: 'BLOCK', reason, details })
    return { executed: false, reason }
  }

  if (env.ENABLE_REAL_TRADING !== 'true') return block('ENABLE_REAL_TRADING is not true.')
  if (env.LIVE_TRADING_CONFIRM !== 'true') return block('LIVE_TRADING_CONFIRM is not true.')
  if (isKillSwitchEnabled(env, await repository.getKillSwitchEnabled())) return block('Kill switch is enabled.')

  try {
    assertProviderHostAllowed(intent.provider, input.providerBaseUrl ?? 'https://api.upbit.com', env.PROVIDER_ALLOWLIST_HOSTS)
  } catch (error) {
    return block(error instanceof Error ? error.message : 'Provider host allowlist failed.')
  }

  if (!hasManualApproval({ status: intent.status })) return block('Order intent is not manually approved.')

  const rate = await input.rateLimiter.check(`${intent.provider}:order`, ORDER_RATE_LIMIT)
  if (!rate.allowed) {
    await repository.recordAudit({ event_type: 'rate_limit', provider: intent.provider, market: intent.market, side: intent.side, order_intent_id: intent.id, idempotency_key: intent.idempotencyKey, decision: 'BLOCK', reason: rate.reason, details: rate.details })
    return block(rate.reason, rate.details)
  }

  const risk = evaluateLiveOrderRisk(env, intent)
  if (!risk.allowed) return block(risk.reason, risk.details)

  const idempotency = await repository.reserveIdempotency({ key: intent.idempotencyKey, scope: 'live-order', status: 'RESERVED', orderIntentId: intent.id })
  if (!idempotency.allowed) return block(idempotency.reason, { existing: idempotency.existing })

  await repository.recordAttempt({ order_intent_id: intent.id, provider: intent.provider, market: intent.market, side: intent.side, status: 'REQUESTED', idempotency_key: intent.idempotencyKey })

  try {
    const order = await input.client.placeOrder(intentToOrderRequest(intent))
    await repository.markIdempotencyExecuted(intent.idempotencyKey)
    await repository.recordAttempt({ order_intent_id: intent.id, provider: intent.provider, market: intent.market, side: intent.side, status: 'EXECUTED', idempotency_key: intent.idempotencyKey, response: order })
    await repository.recordExecutedOrder?.({
      order_intent_id: intent.id,
      provider: intent.provider,
      exchange_order_id: order.orderId,
      market: order.market,
      side: order.side,
      status: order.status,
      idempotency_key: intent.idempotencyKey,
      filled_quantity: order.filledQuantity,
      average_price: order.averagePrice,
      notional_krw: intent.notionalKrw,
      raw: order.raw ?? {}
    })
    await repository.recordAudit({ event_type: 'live_order_execution', provider: intent.provider, market: intent.market, side: intent.side, order_intent_id: intent.id, idempotency_key: intent.idempotencyKey, decision: 'ALLOW', reason: 'Live order executed by approved client.', details: { orderId: order.orderId } })
    return { executed: true, reason: 'Executed.', order }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Live order failed.'
    await repository.recordAttempt({ order_intent_id: intent.id, provider: intent.provider, market: intent.market, side: intent.side, status: 'FAILED', idempotency_key: intent.idempotencyKey, error: reason })
    await repository.recordAudit({ event_type: 'live_order_execution', provider: intent.provider, market: intent.market, side: intent.side, order_intent_id: intent.id, idempotency_key: intent.idempotencyKey, decision: 'FAIL', reason, details: {} })
    return { executed: false, reason }
  }
}
