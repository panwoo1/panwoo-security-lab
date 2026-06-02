import { useEffect, useMemo, useState } from 'react'
import type { NewsItem } from '../generated-content'
import { SectionHeader } from '../components/layout/SectionHeader'
import { NewsList } from '../components/news/NewsList'
import { NewsToolbar } from '../components/news/NewsToolbar'

function splitReadableParagraphs(value: string) {
  const cleanValue = value.replace(/\s+/g, ' ').trim()
  const sentences: string[] = []
  let current = ''

  for (const char of cleanValue) {
    current += char
    if ('.!?。！？'.includes(char)) {
      const sentence = current.trim()
      if (sentence) sentences.push(sentence)
      current = ''
    }
  }

  const rest = current.trim()
  if (rest) sentences.push(rest)

  const paragraphs: string[] = []
  let paragraph = ''

  for (const sentence of sentences) {
    const nextParagraph = paragraph ? `${paragraph} ${sentence}` : sentence
    if (nextParagraph.length > 360 && paragraph) {
      paragraphs.push(paragraph)
      paragraph = sentence
    } else {
      paragraph = nextParagraph
    }
  }

  if (paragraph) paragraphs.push(paragraph)
  return paragraphs.length ? paragraphs : [cleanValue]
}

function splitArticleText(item: NewsItem) {
  const body = item.articleText || item.summary || '본문을 가져오지 못했습니다. 원문 링크에서 확인해 주세요.'
  return splitReadableParagraphs(body)
}

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
  const [selectedSlug, setSelectedSlug] = useState(items[0]?.slug ?? '')
  const selectedItem = useMemo(() => items.find((item) => item.slug === selectedSlug) ?? items[0] ?? null, [items, selectedSlug])
  const articleParagraphs = useMemo(() => (selectedItem ? splitArticleText(selectedItem) : []), [selectedItem])

  useEffect(() => {
    if (!items.length) {
      setSelectedSlug('')
      return
    }

    if (!items.some((item) => item.slug === selectedSlug)) {
      setSelectedSlug(items[0].slug)
    }
  }, [items, selectedSlug])

  return (
    <>
      <SectionHeader
        eyebrow="Security news"
        title="Curated intelligence feed"
        description="수집된 보안 뉴스를 목록에서 선택하고 페이지 안에서 본문을 확인합니다."
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
      <div className="grid gap-4 lg:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.28fr)] lg:items-start">
        <div className="min-w-0 lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto lg:pr-1">
          <NewsList items={items} selectedSlug={selectedItem?.slug} formatDate={formatDate} onSelect={(item) => setSelectedSlug(item.slug)} />
        </div>
        <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/45 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.18)] sm:p-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
          {selectedItem ? (
            <article className="mx-auto grid max-w-[820px] gap-5">
              <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold leading-none">
                <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1.5 text-slate-300">{selectedItem.source}</span>
                <span className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2.5 py-1.5 text-blue-200">
                  {selectedItem.region === 'domestic' ? '국내' : '글로벌'}
                </span>
                <span className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1.5 text-slate-400">{formatDate(selectedItem.published)}</span>
              </div>

              <h3 className="m-0 text-[1.45rem] font-bold leading-tight text-white sm:text-[1.85rem]">{selectedItem.title}</h3>

              {selectedItem.summary ? <p className="m-0 border-l border-blue-400/35 pl-4 text-[1rem] leading-7 text-slate-200">{selectedItem.summary}</p> : null}

              <div className="text-[1.02rem] leading-8 text-slate-200">
                {articleParagraphs.map((paragraph, index) => (
                  <p className="mb-4" key={`${selectedItem.slug}-${index}`}>
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                <a
                  className="rounded-full border border-blue-400/25 bg-blue-400/10 px-3 py-1.5 text-sm font-semibold text-blue-200 transition-all hover:border-blue-300/40 hover:bg-blue-400/15 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
                  href={selectedItem.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  원문 사이트 열기
                </a>
                {selectedItem.translateUrl ? (
                  <a
                    className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-sm font-semibold text-slate-300 transition-all hover:border-blue-400/25 hover:bg-white/[0.06] hover:text-blue-200 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
                    href={selectedItem.translateUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    번역 보기
                  </a>
                ) : null}
              </div>
            </article>
          ) : (
            <p className="m-0 text-sm text-slate-400">선택할 뉴스가 없습니다.</p>
          )}
        </section>
      </div>
    </>
  )
}
