import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import type { BlogPost, NewsItem } from './generated-content'
import { AppShell } from './components/layout/AppShell'
import type { AppSection, BlogPostSummary, ContentState } from './types'
import { AgentsPage } from './pages/Agents'
import { AutomationPage } from './pages/Automation'
import { BlogPage } from './pages/Blog'
import { HomePage } from './pages/Home'
import { LogsPage } from './pages/Logs'
import { NewsPage } from './pages/News'
import { TradingPage } from './pages/Trading'
import { WalletPage } from './pages/Wallet'
import './styles.css'

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
  const haystack = `${item.title} ${item.summary} ${item.articleText ?? ''} ${item.source} ${item.region} ${item.published}`
  return normalized(haystack).includes(query)
}

function matchesPost(post: BlogPostSummary, query: string) {
  const haystack = `${post.title} ${post.excerpt} ${post.date} ${post.categories.join(' ')} ${post.tags.join(' ')}`
  return normalized(haystack).includes(query)
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return (await response.json()) as T
}

async function loadDevelopmentFallback(): Promise<ContentState | null> {
  if (!import.meta.env.DEV) return null

  const generated = await import('./generated-content')
  return {
    generatedAt: generated.generatedAt,
    newsItems: generated.newsItems,
    blogPosts: generated.blogPosts.map(({ content: _content, html: _html, ...post }) => post),
    selectedPost: generated.blogPosts[0] ?? null,
    status: 'ready'
  }
}

function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('overview')
  const [newsQuery, setNewsQuery] = useState('')
  const [blogQuery, setBlogQuery] = useState('')
  const [content, setContent] = useState<ContentState>({
    generatedAt: '',
    newsItems: [],
    blogPosts: [],
    selectedPost: null,
    status: 'loading'
  })
  const newsSearch = normalized(newsQuery)
  const blogSearch = normalized(blogQuery)

  const loadPost = React.useCallback(async (slug: string) => {
    try {
      const detail = await fetchJson<{ generatedAt: string; post: BlogPost }>(`/api/posts/${encodeURIComponent(slug)}`)
      setContent((current) => ({ ...current, selectedPost: detail.post }))
    } catch {
      const fallback = await loadDevelopmentFallback()
      const generated = import.meta.env.DEV ? await import('./generated-content') : null
      const post = generated?.blogPosts.find((item) => item.slug === slug) ?? fallback?.selectedPost ?? null
      setContent((current) => ({ ...current, selectedPost: post }))
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadContent() {
      try {
        const [news, posts] = await Promise.all([
          fetchJson<{ generatedAt: string; items: NewsItem[] }>('/api/news'),
          fetchJson<{ generatedAt: string; items: BlogPostSummary[] }>('/api/posts')
        ])
        const firstSlug = posts.items[0]?.slug
        const firstPost = firstSlug ? await fetchJson<{ generatedAt: string; post: BlogPost }>(`/api/posts/${encodeURIComponent(firstSlug)}`) : null

        if (!cancelled) {
          setContent({
            generatedAt: news.generatedAt || posts.generatedAt,
            newsItems: news.items,
            blogPosts: posts.items,
            selectedPost: firstPost?.post ?? null,
            status: 'ready'
          })
        }
      } catch {
        const fallback = await loadDevelopmentFallback()
        if (!cancelled && fallback) {
          setContent(fallback)
          return
        }
        if (!cancelled) {
          setContent((current) => ({ ...current, status: 'error' }))
        }
      }
    }

    loadContent()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredNews = useMemo(() => {
    const sorted = [...content.newsItems].sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
    return newsSearch ? sorted.filter((item) => matchesNews(item, newsSearch)) : sorted
  }, [content.newsItems, newsSearch])

  const filteredPosts = useMemo(() => {
    return blogSearch ? content.blogPosts.filter((post) => matchesPost(post, blogSearch)) : content.blogPosts
  }, [content.blogPosts, blogSearch])

  function renderSection() {
    if (content.status === 'error') {
      return <p className="my-7 text-slate-400">콘텐츠 API를 불러오지 못했습니다.</p>
    }

    if (content.status === 'loading') {
      return <p className="my-7 text-slate-400">콘텐츠를 불러오는 중입니다.</p>
    }

    if (activeSection === 'news') {
      return (
        <NewsPage
          items={filteredNews}
          query={newsQuery}
          totalCount={content.newsItems.length}
          generatedAt={content.generatedAt}
          onQueryChange={setNewsQuery}
          formatDate={formatDate}
        />
      )
    }

    if (activeSection === 'blog') {
      return (
        <BlogPage
          posts={filteredPosts}
          selectedPost={content.selectedPost}
          query={blogQuery}
          totalCount={content.blogPosts.length}
          generatedAt={content.generatedAt}
          onQueryChange={setBlogQuery}
          onSelect={loadPost}
          formatDate={formatDate}
        />
      )
    }

    if (activeSection === 'agents') return <AgentsPage />
    if (activeSection === 'automation') return <AutomationPage />
    if (activeSection === 'trading') return <TradingPage />
    if (activeSection === 'wallet') return <WalletPage />
    if (activeSection === 'logs') return <LogsPage />

    return (
      <HomePage
        newsCount={content.newsItems.length}
        postsCount={content.blogPosts.length}
        generatedAt={formatDate(content.generatedAt)}
        onSectionChange={setActiveSection}
      />
    )
  }

  return (
    <AppShell activeSection={activeSection} generatedAt={formatDate(content.generatedAt)} onSectionChange={setActiveSection}>
      {renderSection()}
    </AppShell>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
