import React, { useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { blogPosts, generatedAt, newsItems, type BlogPost, type NewsItem } from './generated-content'
import './styles.css'

type Tab = 'news' | 'blog'

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function normalized(value: string) {
  return value.toLowerCase().trim()
}

function matchesNews(item: NewsItem, query: string) {
  const haystack = `${item.title} ${item.summary} ${item.source} ${item.region} ${item.published}`
  return normalized(haystack).includes(query)
}

function matchesPost(post: BlogPost, query: string) {
  const haystack = `${post.title} ${post.excerpt} ${post.date} ${post.categories.join(' ')} ${post.tags.join(' ')}`
  return normalized(haystack).includes(query)
}

function NewsList({ items }: { items: NewsItem[] }) {
  if (!items.length) {
    return <p className="my-7 text-slate-600">검색 결과가 없습니다.</p>
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article className="grid gap-2.5 rounded-lg border border-slate-200 bg-white p-5" key={item.slug}>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-1">{item.source}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">{item.region === 'domestic' ? '국내' : '글로벌'}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">{formatDate(item.published)}</span>
          </div>
          <h2 className="text-lg font-semibold leading-snug tracking-normal text-slate-900">{item.title}</h2>
          <p className="m-0 leading-relaxed text-slate-700">{item.summary}</p>
          <div className="flex flex-wrap gap-2">
            <a className="rounded-full border border-slate-300 px-3 py-1.5 text-blue-700" href={item.url} target="_blank" rel="noreferrer">
              원문 열기
            </a>
            {item.translateUrl ? (
              <a className="rounded-full border border-slate-300 px-3 py-1.5 text-blue-700" href={item.translateUrl} target="_blank" rel="noreferrer">
                번역 보기
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}

function BlogReader({ posts }: { posts: BlogPost[] }) {
  const [selectedSlug, setSelectedSlug] = useState(posts[0]?.slug ?? '')
  const selected = posts.find((post) => post.slug === selectedSlug) ?? posts[0]

  if (!posts.length || !selected) {
    return <p className="my-7 text-slate-600">게시글이 없습니다.</p>
  }

  return (
    <div className="grid min-h-[calc(100vh-190px)] grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="w-full lg:sticky lg:top-5 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto" aria-label="Blog posts">
        <div className="grid max-h-80 gap-2 overflow-y-auto pr-0 lg:max-h-none lg:pr-1">
          {posts.map((post) => (
            <button
              className={[
                'grid gap-1 rounded-lg border bg-white p-3 text-left text-slate-900 transition',
                post.slug === selected.slug ? 'border-blue-700 shadow-[inset_3px_0_0_#1d4ed8]' : 'border-slate-200 hover:border-slate-300'
              ].join(' ')}
              key={post.slug}
              onClick={() => setSelectedSlug(post.slug)}
              type="button"
            >
              <span className="text-sm font-semibold leading-snug">{post.title}</span>
              <small className="text-xs text-slate-500">{post.date || 'No date'}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="min-w-0 w-full px-0 pb-6 lg:px-6 xl:px-10">
        <article className="mx-auto grid w-full max-w-[940px] gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:p-6 lg:p-8">
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-1">{selected.date || 'No date'}</span>
            {selected.categories.slice(0, 3).map((category) => (
              <span className="rounded-full bg-slate-100 px-2 py-1" key={category}>
                {category}
              </span>
            ))}
          </div>
          <h2 className="text-2xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-3xl">{selected.title}</h2>
          {selected.tags.length ? (
            <div className="flex flex-wrap gap-2">
              {selected.tags.slice(0, 8).map((tag) => (
                <span className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="markdown-body" dangerouslySetInnerHTML={{ __html: selected.html }} />
        </article>
      </section>
    </div>
  )
}

function App() {
  const [tab, setTab] = useState<Tab>('news')
  const [query, setQuery] = useState('')
  const search = normalized(query)

  const filteredNews = useMemo(() => {
    const sorted = [...newsItems].sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
    return search ? sorted.filter((item) => matchesNews(item, search)) : sorted
  }, [search])

  const filteredPosts = useMemo(() => {
    return search ? blogPosts.filter((post) => matchesPost(post, search)) : blogPosts
  }, [search])

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-normal text-slate-600">Panwoo Security Lab</p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-none tracking-normal text-slate-950 sm:text-5xl">
            Security news and research notes
          </h1>
        </div>
        <nav className="flex w-full flex-none rounded-lg border border-slate-300 bg-slate-200 p-1 lg:w-auto" aria-label="Primary">
          <button
            className={`min-h-10 flex-1 rounded-md px-4 text-slate-600 lg:min-w-24 ${tab === 'news' ? 'bg-white font-bold text-slate-950 shadow-sm' : ''}`}
            onClick={() => setTab('news')}
            type="button"
          >
            News
          </button>
          <button
            className={`min-h-10 flex-1 rounded-md px-4 text-slate-600 lg:min-w-24 ${tab === 'blog' ? 'bg-white font-bold text-slate-950 shadow-sm' : ''}`}
            onClick={() => setTab('blog')}
            type="button"
          >
            Blog
          </button>
        </nav>
      </header>

      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Search and status">
        <input
          className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-slate-950 sm:max-w-md"
          aria-label="Search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tab === 'news' ? '뉴스 검색' : '블로그 검색'}
          type="search"
          value={query}
        />
        <p className="m-0 text-sm text-slate-600">
          {tab === 'news'
            ? `${filteredNews.length} / ${newsItems.length} news`
            : `${filteredPosts.length} / ${blogPosts.length} posts`}
        </p>
      </section>

      {tab === 'news' ? (
        <>
          <section className="mb-5 flex flex-col gap-2 border-y border-slate-200 py-3 text-sm text-slate-600 sm:flex-row sm:justify-between">
            <p className="m-0">Generated at {formatDate(generatedAt)}</p>
            <p className="m-0">국내외 보안 뉴스를 한 화면에서 검색하고 원문으로 이동합니다.</p>
          </section>
          <NewsList items={filteredNews} />
        </>
      ) : (
        <BlogReader posts={filteredPosts} />
      )}
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
