import test from 'node:test'
import assert from 'node:assert/strict'
import { simulateAutoApproval } from '../services/risk.ts'
import type { StrategySignal, TradingEnv } from '../services/types.ts'

function signal(overrides: Partial<StrategySignal> = {}): StrategySignal {
  return {
    id: 'signal-1',
    exchange: 'upbit',
    market: 'KRW-BTC',
    interval: 'minutes5',
    signal: 'BUY',
    confidence: 0.82,
    reason: 'test signal',
    inputs: {},
    signal_time: '2026-06-27T00:00:00.000Z',
    ...overrides
  }
}

function env(overrides: TradingEnv = {}): TradingEnv {
  return {
    TRADING_ORDER_KRW: '10000',
    MAX_TRADE_KRW: '50000',
    DAILY_MAX_TRADES: '8',
    DAILY_MAX_LOSS_RATE: '0.03',
    AUTO_APPROVAL_MIN_CONFIDENCE: '0.7',
    AUTO_APPROVAL_SIGNALS: 'BUY,SELL',
    ...overrides
  }
}

test('auto approval simulation approves a confident signal that passes paper risk checks', () => {
  const result = simulateAutoApproval(env(), signal(), [], [])

  assert.equal(result.wouldApprove, true)
  assert.equal(result.riskDecision.allowed, true)
})

test('auto approval simulation blocks hold signals', () => {
  const result = simulateAutoApproval(env(), signal({ signal: 'HOLD', confidence: 0.95 }), [], [])

  assert.equal(result.wouldApprove, false)
  assert.match(result.reason, /HOLD/)
})

test('auto approval simulation blocks low confidence signals', () => {
  const result = simulateAutoApproval(env(), signal({ confidence: 0.4 }), [], [])

  assert.equal(result.wouldApprove, false)
  assert.match(result.reason, /confidence/)
})

test('auto approval simulation reuses paper risk blocks', () => {
  const result = simulateAutoApproval(env({ DAILY_MAX_TRADES: '1' }), signal(), [
    {
      id: 'trade-1',
      signal_id: 'old-signal',
      exchange: 'upbit',
      market: 'KRW-BTC',
      side: 'BUY',
      quantity: 1,
      price: 10000,
      notional_krw: 10000,
      pnl_krw: 0,
      reason: 'old trade'
    }
  ], [])

  assert.equal(result.wouldApprove, false)
  assert.match(result.reason, /Daily paper trade count/)
})
