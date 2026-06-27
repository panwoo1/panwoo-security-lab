export type TradingSignal = 'BUY' | 'SELL' | 'HOLD'

export type TradingEnv = {
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  ADMIN_TOKEN?: string
  TRADING_MARKETS?: string
  TRADING_CANDLE_INTERVAL?: string
  TRADING_ORDER_KRW?: string
  MAX_TRADE_KRW?: string
  DAILY_MAX_TRADES?: string
  DAILY_MAX_LOSS_RATE?: string
  ENABLE_REAL_TRADING?: string
  LIVE_TRADING_CONFIRM?: string
  KILL_SWITCH?: string
  PROVIDER_ALLOWLIST_HOSTS?: string
  AUTO_APPROVAL_MIN_CONFIDENCE?: string
  AUTO_APPROVAL_SIGNALS?: string
  UPBIT_ACCESS_KEY?: string
  UPBIT_SECRET_KEY?: string
  AI_PROVIDER?: string
  AI_API_KEY?: string
  COINGECKO_API_KEY?: string
}

export type MarketCandle = {
  exchange: string
  market: string
  interval: string
  candle_time: string
  open_price: number
  high_price: number
  low_price: number
  trade_price: number
  candle_acc_trade_price?: number
  candle_acc_trade_volume?: number
  raw?: unknown
}

export type MarketTicker = {
  exchange: string
  market: string
  ticker_time: string
  trade_price: number
  signed_change_rate?: number
  signed_change_price?: number
  acc_trade_price_24h?: number
  acc_trade_volume_24h?: number
  raw?: unknown
}

export type ResearchSummary = {
  exchange: string
  market: string
  interval: string
  summary: string
  risk_factors: string[]
  metadata: Record<string, unknown>
}

export type StrategySignal = {
  id?: string
  exchange: string
  market: string
  interval: string
  signal: TradingSignal
  confidence: number
  reason: string
  inputs: Record<string, unknown>
  signal_time?: string
  created_at?: string
}

export type PaperTrade = {
  id?: string
  signal_id?: string
  exchange: string
  market: string
  side: 'BUY' | 'SELL'
  status?: string
  quantity: number
  price: number
  notional_krw: number
  pnl_krw: number
  reason: string
  executed_at?: string
  created_at?: string
}
