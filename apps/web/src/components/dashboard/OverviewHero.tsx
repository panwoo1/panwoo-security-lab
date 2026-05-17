import type { AppSection } from '../../types'
import { ComingSoonCard } from './ComingSoonCard'
import { StatCard } from './StatCard'

export function OverviewHero({
  newsCount,
  postsCount,
  generatedAt,
  onSectionChange
}: {
  newsCount: number
  postsCount: number
  generatedAt: string
  onSectionChange: (section: AppSection) => void
}) {
  return (
    <section className="grid gap-4">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_70px_rgba(2,6,23,0.28)] sm:p-6">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-blue-300">Portal overview</p>
            <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">Security lab control surface</h2>
          </div>
          <span className="w-fit rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-xs font-semibold text-blue-200">
            Dashboard shell
          </span>
        </div>
        <p className="relative mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
          뉴스 큐레이션과 리서치 노트를 현재 기능으로 유지하면서, AI 에이전트·자동화·지갑 모니터링·시스템 로그가 자연스럽게
          붙을 수 있는 포털 구조입니다.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          eyebrow="Security News"
          title="Collected intelligence feed"
          description="국내외 보안 뉴스를 수집하고 요약합니다."
          value={`${newsCount}`}
          meta={`Updated ${generatedAt || 'loading'}`}
          onClick={() => onSectionChange('news')}
        />
        <StatCard
          eyebrow="Research Notes"
          title="Blog and lab archive"
          description="CTF, 웹해킹, 리버싱, 보안 실험 기록을 정리합니다."
          value={`${postsCount}`}
          meta="Markdown notes"
          onClick={() => onSectionChange('blog')}
        />
        <ComingSoonCard
          eyebrow="AI Agents"
          title="Agent orchestration dashboard"
          description="에이전트별 작업 상태와 실행 로그를 추적합니다."
          meta="Master · Coder · QA · Security"
          onClick={() => onSectionChange('agents')}
        />
        <ComingSoonCard
          eyebrow="Automation"
          title="Scheduled jobs and runs"
          description="뉴스 수집기, 분석 파이프라인, 외부 시스템 자동화를 연결할 영역입니다."
          meta="Discord · GitHub · Cloudflare · Supabase"
          onClick={() => onSectionChange('automation')}
        />
        <ComingSoonCard
          eyebrow="Wallet Automation"
          title="Read-only portfolio monitor"
          description="지갑 상태와 전략 실행 기록을 안전한 read-only 구조로 설계합니다."
          meta="No private keys in frontend"
          note="Server-side signer required later"
          onClick={() => onSectionChange('wallet')}
        />
        <ComingSoonCard
          eyebrow="System Logs"
          title="Worker, build, and task logs"
          description="배포 상태, 작업 로그, 자동화 실행 기록을 모으는 공간입니다."
          meta="Operational timeline placeholder"
          onClick={() => onSectionChange('logs')}
        />
      </div>
    </section>
  )
}
