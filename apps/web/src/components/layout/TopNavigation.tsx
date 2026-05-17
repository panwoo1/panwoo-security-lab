import type { AppSection, NavItem } from '../../types'

export const portalNavItems: NavItem[] = [
  { id: 'overview', label: 'Overview', description: 'Lab summary', status: 'live' },
  { id: 'news', label: 'News', description: 'Security feed', status: 'live' },
  { id: 'blog', label: 'Blog', description: 'Research notes', status: 'live' },
  { id: 'agents', label: 'Agents', description: 'Runtime status', status: 'coming-soon' },
  { id: 'automation', label: 'Automation', description: 'Jobs and runs', status: 'coming-soon' },
  { id: 'wallet', label: 'Wallet', description: 'Read-only monitor', status: 'coming-soon' },
  { id: 'logs', label: 'Logs', description: 'System events', status: 'coming-soon' }
]

export function TopNavigation({
  activeSection,
  onSectionChange
}: {
  activeSection: AppSection
  onSectionChange: (section: AppSection) => void
}) {
  return (
    <nav className="-mt-px mb-5 overflow-x-auto rounded-b-2xl border-x border-b border-white/10 bg-slate-950/70 p-2 shadow-[0_18px_60px_rgba(2,6,23,0.28)] backdrop-blur" aria-label="Lab sections">
      <div className="flex min-w-max gap-1.5">
        {portalNavItems.map((item) => (
          <button
            aria-current={activeSection === item.id ? 'page' : undefined}
            aria-pressed={activeSection === item.id}
            className={[
              'group rounded-xl border px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 sm:px-4',
              activeSection === item.id
                ? 'border-blue-400/25 bg-white/[0.07] text-white shadow-sm'
                : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-100'
            ].join(' ')}
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            type="button"
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              {item.label}
              {item.status === 'coming-soon' ? (
                <span
                  className={[
                    'rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-normal',
                    activeSection === item.id
                      ? 'border border-white/10 bg-white/10 text-slate-200'
                      : 'border border-white/10 bg-white/[0.04] text-slate-500'
                  ].join(' ')}
                >
                  Soon
                </span>
              ) : null}
            </span>
            <span className={['mt-0.5 block text-xs', activeSection === item.id ? 'text-slate-300' : 'text-slate-500'].join(' ')}>
              {item.description}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
