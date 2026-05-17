import type { NewsItem } from '../generated-content'
import { SectionHeader } from '../components/layout/SectionHeader'
import { NewsList } from '../components/news/NewsList'
import { NewsToolbar } from '../components/news/NewsToolbar'

export function NewsPage({
  items,
  query,
  totalCount,
  generatedAt,
  onQueryChange,
  formatDate
}: {
  items: NewsItem[]
  query: string
  totalCount: number
  generatedAt: string
  onQueryChange: (query: string) => void
  formatDate: (value: string) => string
}) {
  return (
    <>
      <SectionHeader
        eyebrow="Security news"
        title="Curated intelligence feed"
        description="국내외 보안 뉴스를 한 화면에서 검색하고 원문으로 이동합니다."
      />
      <NewsToolbar
        query={query}
        resultCount={items.length}
        totalCount={totalCount}
        label="뉴스 검색"
        placeholder="뉴스 검색"
        onQueryChange={onQueryChange}
      />
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Generated at {formatDate(generatedAt)}</p>
      <NewsList items={items} formatDate={formatDate} />
    </>
  )
}
