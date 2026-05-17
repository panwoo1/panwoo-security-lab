import { ComingSoonCard } from '../components/dashboard/ComingSoonCard'
import { SectionHeader } from '../components/layout/SectionHeader'

export function LogsPage() {
  return (
    <>
      <SectionHeader
        eyebrow="System logs"
        title="Operational timeline"
        description="Worker 빌드, 자동화 실행, 봇 작업, 보안 실험 로그를 하나의 타임라인으로 모을 예정입니다."
      />
      <div className="grid gap-3 md:grid-cols-2">
        <ComingSoonCard
          eyebrow="Worker"
          title="Cloudflare runtime events"
          description="배포, dry-run, cron 실행 상태를 보여줄 영역입니다."
          meta="Coming soon"
        />
        <ComingSoonCard
          eyebrow="Task history"
          title="Automation and agent logs"
          description="에이전트 작업, 자동화 결과, 실패 원인을 추적할 영역입니다."
          meta="Coming soon"
        />
      </div>
    </>
  )
}
