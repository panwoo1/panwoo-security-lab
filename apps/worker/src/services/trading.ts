import { summarizeMarketData } from './ai'
import { getUpbitCandles, getUpbitTickers, parseMarkets } from './upbit'
import { generateStrategySignal } from './strategy'
import { evaluatePaperTradeRisk, getAutoApprovalPolicy, getRiskConfig, simulateAutoApproval } from './risk'
import { signalToOrderIntent } from './trading/orderMapper.ts'
import {
  getReadDb,
  getWriteDb,
  logJob,
  logRisk,
  saveCandles,
  savePaperTrade,
  saveSignal,
  saveTickers
} from './supabase'
import type { MarketCandle, MarketTicker, PaperTrade, StrategySignal, TradingEnv } from './types'

export function getTradingMarkets(env: TradingEnv) {
  return parseMarkets(env.TRADING_MARKETS)
}

export async function runCollector(env: TradingEnv) {
  const markets = getTradingMarkets(env)
  const interval = env.TRADING_CANDLE_INTERVAL || 'minutes5'
  const tickers = await getUpbitTickers(markets)
  await saveTickers(env, tickers)

  const candles: MarketCandle[] = []
  for (const market of markets) {
    const rows = await getUpbitCandles(market, interval, 20)
    candles.push(...rows)
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  await saveCandles(env, candles)

  return { markets, interval, tickers: tickers.length, candles: candles.length }
}

export async function runAnalysis(env: TradingEnv, reportType: 'hourly' | 'daily' = 'hourly') {
  const markets = getTradingMarkets(env)
  const interval = env.TRADING_CANDLE_INTERVAL || 'minutes5'
  const db = getWriteDb(env)
  const signals: StrategySignal[] = []

  for (const market of markets) {
    const candles = await getReadDb(env).select<MarketCandle>('market_candles', {
      select: '*',
      filters: { exchange: 'eq.upbit', market: `eq.${market}`, interval: `eq.${interval}` },
      order: 'candle_time.desc',
      limit: reportType === 'daily' ? 120 : 48
    })
    const tickers = await getReadDb(env).select<MarketTicker>('market_tickers', {
      select: '*',
      filters: { exchange: 'eq.upbit', market: `eq.${market}` },
      order: 'ticker_time.desc',
      limit: 1
    })

    if (candles.length === 0) continue

    const research = await summarizeMarketData(env, market, interval, candles, tickers)
    const [savedResearch] = await db.insert<{ id: string }>('market_research', [
      {
        exchange: research.exchange,
        market: research.market,
        interval: research.interval,
        summary: research.summary,
        risk_factors: research.risk_factors,
        metadata: { ...research.metadata, reportType }
      }
    ])
    await db.insert('ai_research_notes', [
      {
        research_id: savedResearch?.id,
        provider: String(research.metadata.provider ?? 'mock'),
        note_type: reportType === 'daily' ? 'daily_report' : 'market_summary',
        content: research.summary,
        risk_level: research.risk_factors.length > 1 ? 'high' : 'medium'
      }
    ], false)

    const [signal] = await saveSignal(env, generateStrategySignal(research, candles))
    if (signal) {
      signals.push(signal)
      const intent = signalToOrderIntent(signal, getRiskConfig(env).orderKrw)
      if (intent) {
        await db.insert('order_intents', [
          {
            signal_id: intent.signalId,
            provider: intent.provider,
            exchange: intent.exchange,
            market: intent.market,
            side: intent.side,
            order_type: intent.orderType,
            status: 'WAITING_APPROVAL',
            quantity: intent.quantity,
            notional_krw: intent.notionalKrw,
            limit_price: intent.limitPrice,
            idempotency_key: intent.idempotencyKey,
            reason: intent.reason,
            risk_snapshot: { generatedFromSignal: true }
          }
        ], false)
      }
    }
  }

  return { markets, interval, reportType, signals: signals.length }
}

export async function runJob(env: TradingEnv, jobName: string, task: () => Promise<unknown>) {
  const startedAt = new Date().toISOString()
  try {
    const result = await task()
    await logJob(env, {
      job_name: jobName,
      status: 'success',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      details: result ?? {}
    })
    return result
  } catch (error) {
    await logJob(env, {
      job_name: jobName,
      status: 'failed',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      details: {},
      error: error instanceof Error ? error.message : 'Unknown error'
    }).catch(() => undefined)
    throw error
  }
}

export async function executePaperTrade(env: TradingEnv, signalId?: string, market?: string) {
  const filters: Record<string, string> = {}
  if (signalId) filters.id = `eq.${signalId}`
  if (market) filters.market = `eq.${market.toUpperCase()}`

  const [signal] = await getReadDb(env).select<StrategySignal>('strategy_signals', {
    select: '*',
    filters,
    order: 'signal_time.desc',
    limit: 1
  })
  if (!signal) throw new Error('No strategy signal found for paper execution')

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayTrades = await getReadDb(env).select<PaperTrade>('paper_trades', {
    select: '*',
    filters: { created_at: `gte.${today.toISOString()}` },
    order: 'created_at.desc',
    limit: 100
  })
  const marketTrades = await getReadDb(env).select<PaperTrade>('paper_trades', {
    select: '*',
    filters: { exchange: `eq.${signal.exchange}`, market: `eq.${signal.market}` },
    order: 'executed_at.desc',
    limit: 20
  })
  const decision = evaluatePaperTradeRisk(env, signal, todayTrades, marketTrades)

  if (!decision.allowed) {
    await logRisk(env, {
      exchange: signal.exchange,
      market: signal.market,
      signal_id: signal.id,
      decision: 'BLOCK',
      reason: decision.reason,
      details: decision.details
    })
    return { executed: false, decision }
  }

  const [latestTicker] = await getReadDb(env).select<MarketTicker>('market_tickers', {
    select: '*',
    filters: { exchange: `eq.${signal.exchange}`, market: `eq.${signal.market}` },
    order: 'ticker_time.desc',
    limit: 1
  })
  if (!latestTicker) throw new Error('No ticker available for paper execution')

  const notional = Math.min(getRiskConfig(env).orderKrw, getRiskConfig(env).maxTradeKrw)
  const price = Number(latestTicker.trade_price)
  const quantity = notional / price
  const side = signal.signal === 'SELL' ? 'SELL' : 'BUY'
  const latestBuy = marketTrades.find((trade) => trade.side === 'BUY')
  const pnl = side === 'SELL' && latestBuy ? (price - Number(latestBuy.price)) * Number(latestBuy.quantity) : 0
  const [trade] = await savePaperTrade(env, {
    signal_id: signal.id,
    exchange: signal.exchange,
    market: signal.market,
    side,
    quantity,
    price,
    notional_krw: notional,
    pnl_krw: pnl,
    reason: signal.reason
  })

  await logRisk(env, {
    exchange: signal.exchange,
    market: signal.market,
    signal_id: signal.id,
    decision: 'ALLOW',
    reason: decision.reason,
    details: decision.details
  })

  return { executed: true, decision, trade }
}

export async function getAutoApprovalSimulation(env: TradingEnv) {
  try {
    const signals = await getReadDb(env).select<StrategySignal>('strategy_signals', {
      select: '*',
      order: 'signal_time.desc',
      limit: 20
    })

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayTrades = await getReadDb(env).select<PaperTrade>('paper_trades', {
      select: '*',
      filters: { created_at: `gte.${today.toISOString()}` },
      order: 'created_at.desc',
      limit: 100
    })
    const recentTrades = await getReadDb(env).select<PaperTrade>('paper_trades', {
      select: '*',
      order: 'executed_at.desc',
      limit: 100
    })

    return {
      policy: getAutoApprovalPolicy(env),
      items: signals.map((signal) => simulateAutoApproval(
        env,
        signal,
        todayTrades,
        recentTrades.filter((trade) => trade.exchange === signal.exchange && trade.market === signal.market)
      ))
    }
  } catch {
    return {
      policy: getAutoApprovalPolicy(env),
      items: [],
      warning: 'trading-storage-unavailable'
    }
  }
}

export async function getLiveResearchPreview(env: TradingEnv) {
  const markets = getTradingMarkets(env).slice(0, 3)
  const interval = env.TRADING_CANDLE_INTERVAL || 'minutes5'

  try {
    const tickers = await getUpbitTickers(markets)
    const research = []
    const signals = []

    for (const market of markets) {
      const candles = await getUpbitCandles(market, interval, 20)
      const summary = await summarizeMarketData(env, market, interval, candles, tickers)
      research.push({
        ...summary,
        id: `preview-${market}`,
        research_time: new Date().toISOString()
      })
      signals.push({
        ...generateStrategySignal(summary, candles),
        id: `preview-${market}`,
        signal_time: new Date().toISOString()
      })
    }

    return { items: research, signals, source: 'live-preview' }
  } catch {
    return { items: [], signals: [], source: 'live-preview', warning: 'market-preview-unavailable' }
  }
}
