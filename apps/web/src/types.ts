import type { BlogPost } from './generated-content'

export type AppSection = 'overview' | 'news' | 'blog' | 'trading' | 'agents' | 'automation' | 'wallet' | 'logs'

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

export type HarnessAgent = {
  role?: string
  display_name?: string
  bot_user_id?: string
  status?: string
  model?: string
}

export type HarnessJob = {
  job_id?: string
  id?: string
  state?: string
  goal?: string
  request?: string
  created_at?: string
  updated_at?: string
}
