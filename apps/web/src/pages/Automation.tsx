import { AutomationPreview } from '../components/automation/AutomationPreview'
import { SectionHeader } from '../components/layout/SectionHeader'

export function AutomationPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Automation"
        title="Jobs and execution pipeline"
        description="Discord, GitHub, Cloudflare Worker, Supabase, 뉴스 수집기, AI 분석 파이프라인을 연결할 자동화 영역입니다."
      />
      <AutomationPreview />
    </>
  )
}
