export function StatusCard({
  eyebrow,
  title,
  description,
  status,
  meta,
  tone = 'slate'
}: {
  eyebrow: string
  title: string
  description: string
  status: string
  meta: string
  tone?: 'slate' | 'blue' | 'amber' | 'red'
}) {
  const toneClass = {
    slate: 'bg-slate-400',
    blue: 'bg-blue-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400'
  }[tone]

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_10px_30px_rgba(2,6,23,0.18)] transition-colors hover:border-blue-400/25 hover:bg-white/[0.05]">
      <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{eyebrow}</p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.045] px-2 py-1 text-xs font-semibold text-slate-300">
          <span className={`h-2 w-2 rounded-full ${toneClass}`} aria-hidden="true" />
          {status}
        </span>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{meta}</p>
    </article>
  )
}
