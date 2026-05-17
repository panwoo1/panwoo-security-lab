export function StatCard({
  eyebrow,
  title,
  description,
  value,
  meta,
  status = 'Live',
  onClick
}: {
  eyebrow: string
  title: string
  description: string
  value: string
  meta: string
  status?: string
  onClick?: () => void
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{eyebrow}</p>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-300">{status}</span>
      </div>
      <h3 className="mt-4 text-lg font-bold leading-snug text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-5 flex items-end justify-between gap-3">
        <strong className="text-3xl font-extrabold text-white">{value}</strong>
        <span className="text-right text-xs font-medium leading-5 text-slate-500">{meta}</span>
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-left shadow-[0_10px_30px_rgba(2,6,23,0.22)] transition-all hover:border-blue-400/30 hover:bg-white/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    )
  }

  return <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_10px_30px_rgba(2,6,23,0.22)]">{content}</article>
}
