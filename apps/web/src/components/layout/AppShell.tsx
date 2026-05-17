import type { ReactNode } from 'react'
import type { AppSection } from '../../types'
import { Header } from './Header'
import { TopNavigation } from './TopNavigation'

export function AppShell({
  activeSection,
  generatedAt,
  onSectionChange,
  children
}: {
  activeSection: AppSection
  generatedAt: string
  onSectionChange: (section: AppSection) => void
  children: ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1020] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(37,99,235,0.18),transparent_28rem),radial-gradient(circle_at_82%_10%,rgba(79,70,229,0.14),transparent_24rem)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
      <main className="relative mx-auto min-h-screen w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Header />
        <TopNavigation activeSection={activeSection} onSectionChange={onSectionChange} />
        <div className="min-w-0">{children}</div>
        <footer className="mt-8 border-t border-white/10 py-5 text-xs text-slate-500">
          <p className="m-0">Generated at {generatedAt || 'loading'} · Cloudflare Worker static portal · Panwoo Security Lab</p>
        </footer>
      </main>
    </div>
  )
}
