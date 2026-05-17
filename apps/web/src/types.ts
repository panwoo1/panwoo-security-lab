import type { BlogPost } from './generated-content'

export type AppSection = 'overview' | 'news' | 'blog' | 'agents' | 'automation' | 'wallet' | 'logs'

export type BlogPostSummary = Omit<BlogPost, 'content' | 'html'>

export type ContentState = {
  generatedAt: string
  newsItems: import('./generated-content').NewsItem[]
  blogPosts: BlogPostSummary[]
  selectedPost: BlogPost | null
  status: 'loading' | 'ready' | 'error'
}

export type NavItem = {
  id: AppSection
  label: string
  description: string
  status?: 'live' | 'coming-soon'
}
