import type { AppSection } from '../types'
import { OverviewHero } from '../components/dashboard/OverviewHero'

export function HomePage({
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
  return <OverviewHero newsCount={newsCount} postsCount={postsCount} generatedAt={generatedAt} onSectionChange={onSectionChange} />
}
