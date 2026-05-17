import { useEffect, useState } from 'react'
import type { BlogPost } from '../generated-content'
import type { BlogPostSummary } from '../types'
import { SectionHeader } from '../components/layout/SectionHeader'
import { NewsToolbar } from '../components/news/NewsToolbar'

function BlogReader({
  posts,
  selectedPost,
  onSelect
}: {
  posts: BlogPostSummary[]
  selectedPost: BlogPost | null
  onSelect: (slug: string) => void
}) {
  const [selectedSlug, setSelectedSlug] = useState(posts[0]?.slug ?? '')
  const selected = selectedPost?.slug === selectedSlug ? selectedPost : null

  useEffect(() => {
    if (!posts.length) return
    if (!posts.some((post) => post.slug === selectedSlug)) {
      const nextSlug = posts[0].slug
      setSelectedSlug(nextSlug)
      onSelect(nextSlug)
    }
  }, [onSelect, posts, selectedSlug])

  if (!posts.length) {
    return <p className="my-7 text-slate-400">게시글이 없습니다.</p>
  }

  return (
    <div className="grid min-h-[calc(100vh-190px)] grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="w-full lg:sticky lg:top-5 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto" aria-label="Blog posts">
        <div className="grid max-h-80 gap-2 overflow-y-auto pr-0 lg:max-h-none lg:pr-1">
          {posts.map((post) => (
            <button
              className={[
                'grid gap-1.5 rounded-2xl border bg-white/[0.035] p-3.5 text-left text-slate-200 shadow-[0_10px_30px_rgba(2,6,23,0.14)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40',
                post.slug === selectedSlug
                  ? 'border-blue-400/35 bg-blue-400/10 shadow-[inset_3px_0_0_#60a5fa]'
                  : 'border-white/10 hover:border-blue-400/25 hover:bg-white/[0.055]'
              ].join(' ')}
              key={post.slug}
              onClick={() => {
                setSelectedSlug(post.slug)
                onSelect(post.slug)
              }}
              type="button"
            >
              <span className="text-sm font-bold leading-snug text-white">{post.title}</span>
              <small className="text-xs font-medium text-slate-500">{post.date || 'No date'}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="min-w-0 w-full px-0 pb-6 lg:px-6 xl:px-10">
        {selected ? (
          <article className="mx-auto grid w-full max-w-[940px] gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_70px_rgba(2,6,23,0.25)] sm:p-6 lg:p-8">
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1.5">{selected.date || 'No date'}</span>
              {selected.categories.slice(0, 3).map((category) => (
                <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1.5" key={category}>
                  {category}
                </span>
              ))}
            </div>
            <h3 className="text-2xl font-bold leading-tight tracking-normal text-white sm:text-3xl">{selected.title}</h3>
            {selected.tags.length ? (
              <div className="flex flex-wrap gap-2">
                {selected.tags.slice(0, 8).map((tag) => (
                  <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-sm font-medium text-slate-300" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: selected.html }} />
          </article>
        ) : (
          <p className="mx-auto my-7 max-w-[940px] text-slate-400">게시글을 불러오는 중입니다.</p>
        )}
      </section>
    </div>
  )
}

export function BlogPage({
  posts,
  selectedPost,
  query,
  totalCount,
  generatedAt,
  onQueryChange,
  onSelect,
  formatDate
}: {
  posts: BlogPostSummary[]
  selectedPost: BlogPost | null
  query: string
  totalCount: number
  generatedAt: string
  onQueryChange: (query: string) => void
  onSelect: (slug: string) => void
  formatDate: (value: string) => string
}) {
  return (
    <>
      <SectionHeader
        eyebrow="Research notes"
        title="Blog and lab notebook"
        description="보안 연구 노트와 실습 기록을 빠르게 탐색합니다."
      />
      <NewsToolbar
        query={query}
        resultCount={posts.length}
        totalCount={totalCount}
        label="블로그 검색"
        placeholder="블로그 검색"
        onQueryChange={onQueryChange}
      />
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Generated at {formatDate(generatedAt)}</p>
      <BlogReader posts={posts} selectedPost={selectedPost} onSelect={onSelect} />
    </>
  )
}
