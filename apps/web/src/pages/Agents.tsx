import { AgentStatusPreview } from '../components/agents/AgentStatusPreview'
import { SectionHeader } from '../components/layout/SectionHeader'

export function AgentsPage() {
  return (
    <>
      <SectionHeader
        eyebrow="AI agents"
        title="Agent dashboard placeholder"
        description="에이전트별 역할, 상태, 마지막 실행, 현재 작업을 표시할 수 있는 관제 영역입니다."
      />
      <AgentStatusPreview />
    </>
  )
}
