import type { NewsItem } from '../../generated-content'
import { NewsCard } from './NewsCard'

export function NewsList({ items, formatDate }: { items: NewsItem[]; formatDate: (value: string) => string }) {
  if (!items.length) {
    return <p className="my-7 text-slate-400">검색 결과가 없습니다.</p>
  }

  return (
    <section className="grid gap-2.5 sm:gap-3" aria-label="News list">
      {items.map((item) => (
        <NewsCard item={item} formatDate={formatDate} key={item.slug} />
      ))}
    </section>
  )
}
