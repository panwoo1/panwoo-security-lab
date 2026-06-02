import { useEffect, useState } from 'react'

type TradingHealth = {
  ok?: boolean
  markets?: string[]
  paperTrading?: boolean
  realTradingEnabled?: boolean
  supabaseConfigured?: boolean
}

type Signal = {
  id?: string
  market?: string
  signal?: 'BUY' | 'SELL' | 'HOLD'
  confidence?: number
  reason?: string
  signal_time?: string
}

type Research = {
  id?: string
  market?: string
  summary?: string
  risk_factors?: string[]
  research_time?: string
}

type PaperTrade = {
  id?: string
  market?: string
  side?: 'BUY' | 'SELL'
  quantity?: number
  price?: number
  notional_krw?: number
  pnl_krw?: number
  reason?: string
  executed_at?: string
}

type RiskLog = {
  id?: string
  market?: string
  decision?: 'ALLOW' | 'BLOCK'
  reason?: string
  created_at?: string
}

type TradingState = {
  health: TradingHealth | null
  signals: Signal[]
  research: Research[]
  trades: PaperTrade[]
  risks: RiskLog[]
  status: 'loading' | 'ready' | 'error'
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function formatKrw(value?: number) {
  if (typeof value !== 'number') return '-'
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(value)
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return (await response.json()) as T
}

export function TradingPage() {
  const [state, setState] = useState<TradingState>({
    health: null,
    signals: [],
    research: [],
    trades: [],
    risks: [],
    status: 'loading'
  })

  useEffect(() => {
    let cancelled = false

    async function loadTrading() {
      try {
        const [health, signals, research, trades] = await Promise.all([
          fetchJson<TradingHealth>('/api/trading/health'),
          fetchJson<{ items: Signal[] }>('/api/trading/signals/latest'),
          fetchJson<{ items: Research[] }>('/api/trading/research/latest'),
          fetchJson<{ items: PaperTrade[]; riskLogs: RiskLog[] }>('/api/trading/paper-trades')
        ])

        if (!cancelled) {
          setState({
            health,
            signals: signals.items,
            research: research.items,
            trades: trades.items,
            risks: trades.riskLogs,
            status: 'ready'
          })
        }
      } catch {
        if (!cancelled) setState((current) => ({ ...current, status: 'error' }))
      }
    }

    loadTrading()

    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return <p className="my-7 text-slate-400">Trading 데이터를 불러오는 중입니다.</p>
  }

  if (state.status === 'error') {
    return <p className="my-7 text-slate-400">Trading API를 불러오지 못했습니다.</p>
  }

  const latestResearch = state.research[0]

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-normal text-blue-300">Paper trading</p>
        <h2 className="mt-2 text-2xl font-bold tracking-normal text-white sm:text-3xl">Market Research Console</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Market Health</p>
          <p className="mt-2 text-xl font-bold text-white">{state.health?.ok ? 'Online' : 'Offline'}</p>
          <p className="mt-1 text-sm text-slate-400">{state.health?.markets?.join(', ') || 'No markets'}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Trading Mode</p>
          <p className="mt-2 text-xl font-bold text-white">{state.health?.paperTrading ? 'Paper' : 'Disabled'}</p>
          <p className="mt-1 text-sm text-slate-400">Live: {state.health?.realTradingEnabled ? 'blocked by code' : 'off'}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Latest Signals</p>
          <p className="mt-2 text-xl font-bold text-white">{state.signals.length}</p>
          <p className="mt-1 text-sm text-slate-400">Stored strategy outputs</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500">Risk Logs</p>
          <p className="mt-2 text-xl font-bold text-white">{state.risks.length}</p>
          <p className="mt-1 text-sm text-slate-400">Allow/block audit trail</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
          <h3 className="text-base font-bold text-white">AI Research Summary</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">{latestResearch?.summary || '아직 저장된 시장 요약이 없습니다.'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(latestResearch?.risk_factors || []).map((item) => (
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs text-amber-100" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
          <h3 className="text-base font-bold text-white">Latest Signals</h3>
          <div className="mt-3 space-y-3">
            {state.signals.slice(0, 5).map((signal) => (
              <div className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0" key={signal.id ?? `${signal.market}-${signal.signal_time}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-white">{signal.market}</p>
                  <span className="rounded-full border border-blue-300/20 bg-blue-300/10 px-2.5 py-1 text-xs font-bold text-blue-100">
                    {signal.signal}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{signal.reason}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(signal.signal_time)}</p>
              </div>
            ))}
            {state.signals.length === 0 ? <p className="text-sm text-slate-400">저장된 신호가 없습니다.</p> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
          <h3 className="text-base font-bold text-white">Paper Trades</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-normal text-slate-500">
                <tr>
                  <th className="py-2">Time</th>
                  <th>Market</th>
                  <th>Side</th>
                  <th>Notional</th>
                  <th>PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {state.trades.slice(0, 8).map((trade) => (
                  <tr key={trade.id ?? `${trade.market}-${trade.executed_at}`}>
                    <td className="py-2">{formatDate(trade.executed_at)}</td>
                    <td>{trade.market}</td>
                    <td>{trade.side}</td>
                    <td>{formatKrw(trade.notional_krw)}</td>
                    <td className={Number(trade.pnl_krw) < 0 ? 'text-rose-300' : 'text-emerald-300'}>{formatKrw(trade.pnl_krw)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {state.trades.length === 0 ? <p className="mt-3 text-sm text-slate-400">가상 거래 기록이 없습니다.</p> : null}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
          <h3 className="text-base font-bold text-white">Risk Logs</h3>
          <div className="mt-3 space-y-3">
            {state.risks.slice(0, 8).map((risk) => (
              <div className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0" key={risk.id ?? `${risk.market}-${risk.created_at}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-white">{risk.market}</p>
                  <span className={['rounded-full border px-2.5 py-1 text-xs font-bold', risk.decision === 'BLOCK' ? 'border-rose-300/20 bg-rose-300/10 text-rose-100' : 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'].join(' ')}>
                    {risk.decision}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{risk.reason}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(risk.created_at)}</p>
              </div>
            ))}
            {state.risks.length === 0 ? <p className="text-sm text-slate-400">리스크 로그가 없습니다.</p> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
