import type { MarketCandle, MarketTicker, PaperTrade, StrategySignal, TradingEnv } from './types'

type QueryOptions = {
  select?: string
  filters?: Record<string, string>
  order?: string
  limit?: number
}

export class SupabaseRest {
  private readonly baseUrl: URL
  private readonly apiKey: string

  constructor(env: TradingEnv, write = false) {
    if (!env.SUPABASE_URL) throw new Error('SUPABASE_URL is not configured')
    this.baseUrl = new URL(env.SUPABASE_URL)
    if (this.baseUrl.protocol !== 'https:' || !this.baseUrl.hostname.endsWith('.supabase.co')) {
      throw new Error('SUPABASE_URL must be a Supabase HTTPS project URL')
    }
    this.apiKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY ?? ''
    if (!this.apiKey) throw new Error(write ? 'SUPABASE_SERVICE_ROLE_KEY is not configured' : 'SUPABASE_ANON_KEY is not configured')
  }

  private url(table: string, options: QueryOptions = {}) {
    const url = new URL(`/rest/v1/${table}`, this.baseUrl)
    if (options.select) url.searchParams.set('select', options.select)
    if (options.order) url.searchParams.set('order', options.order)
    if (options.limit) url.searchParams.set('limit', String(options.limit))
    Object.entries(options.filters ?? {}).forEach(([key, value]) => url.searchParams.set(key, value))
    return url
  }

  private headers(prefer?: string): HeadersInit {
    return {
      apikey: this.apiKey,
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    }
  }

  async select<T>(table: string, options: QueryOptions = {}): Promise<T[]> {
    const response = await fetch(this.url(table, options), {
      headers: this.headers(),
      signal: AbortSignal.timeout(6000)
    })
    if (!response.ok) throw new Error(`Supabase select ${table} failed: ${response.status}`)
    return (await response.json()) as T[]
  }

  async count(table: string, filters: Record<string, string>): Promise<number> {
    const response = await fetch(this.url(table, { filters, select: '*' }), {
      headers: {
        ...this.headers(),
        Prefer: 'count=exact',
        Range: '0-0'
      },
      signal: AbortSignal.timeout(6000)
    })
    if (!response.ok) throw new Error(`Supabase count ${table} failed: ${response.status}`)
    const range = response.headers.get('Content-Range') ?? ''
    const total = range.split('/')[1]
    return total ? Number(total) : 0
  }

  async rpc<T>(name: string, body: Record<string, unknown>): Promise<T[]> {
    const response = await fetch(new URL(`/rest/v1/rpc/${name}`, this.baseUrl), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000)
    })
    if (!response.ok) throw new Error(`Supabase RPC ${name} failed: ${response.status}`)
    const payload = await response.json()
    return Array.isArray(payload) ? (payload as T[]) : [payload as T]
  }

  async insert<T>(table: string, rows: unknown[], returning = true): Promise<T[]> {
    if (rows.length === 0) return []
    const response = await fetch(this.url(table), {
      method: 'POST',
      headers: this.headers(returning ? 'return=representation' : 'return=minimal'),
      body: JSON.stringify(rows),
      signal: AbortSignal.timeout(6000)
    })
    if (!response.ok) throw new Error(`Supabase insert ${table} failed: ${response.status}`)
    return returning ? ((await response.json()) as T[]) : []
  }

  async update<T>(table: string, row: Record<string, unknown>, filters: Record<string, string>, returning = true): Promise<T[]> {
    const response = await fetch(this.url(table, { filters }), {
      method: 'PATCH',
      headers: this.headers(returning ? 'return=representation' : 'return=minimal'),
      body: JSON.stringify({ ...row, updated_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(6000)
    })
    if (!response.ok) throw new Error(`Supabase update ${table} failed: ${response.status}`)
    return returning ? ((await response.json()) as T[]) : []
  }

  async upsert<T>(table: string, rows: unknown[], onConflict: string): Promise<T[]> {
    if (rows.length === 0) return []
    const url = this.url(table)
    url.searchParams.set('on_conflict', onConflict)
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers('resolution=merge-duplicates,return=representation'),
      body: JSON.stringify(rows),
      signal: AbortSignal.timeout(6000)
    })
    if (!response.ok) throw new Error(`Supabase upsert ${table} failed: ${response.status}`)
    return (await response.json()) as T[]
  }
}

export function getReadDb(env: TradingEnv) {
  return new SupabaseRest(env, false)
}

export function getWriteDb(env: TradingEnv) {
  return new SupabaseRest(env, true)
}

export async function saveCandles(env: TradingEnv, candles: MarketCandle[]) {
  return getWriteDb(env).upsert<MarketCandle>('market_candles', candles, 'exchange,market,interval,candle_time')
}

export async function saveTickers(env: TradingEnv, tickers: MarketTicker[]) {
  return getWriteDb(env).insert<MarketTicker>('market_tickers', tickers, false)
}

export async function saveSignal(env: TradingEnv, signal: StrategySignal) {
  return getWriteDb(env).insert<StrategySignal>('strategy_signals', [signal])
}

export async function savePaperTrade(env: TradingEnv, trade: PaperTrade) {
  return getWriteDb(env).insert<PaperTrade>('paper_trades', [trade])
}

export async function logRisk(env: TradingEnv, row: Record<string, unknown>) {
  return getWriteDb(env).insert('risk_logs', [row], false)
}

export async function logJob(env: TradingEnv, row: Record<string, unknown>) {
  return getWriteDb(env).insert('system_jobs', [row], false)
}

export function getRateLimitLogStore(env: TradingEnv) {
  const db = getWriteDb(env)
  return {
    async recentAllowed(scope: string, sinceIso: string) {
      return db.count('rate_limit_logs', {
        scope: `eq.${scope}`,
        allowed: 'eq.true',
        created_at: `gte.${sinceIso}`
      })
    },
    async record(row: { provider: string; operation: string; scope: string; allowed: boolean; reason: string; details: Record<string, unknown> }) {
      await db.insert('rate_limit_logs', [row], false)
    }
  }
}
