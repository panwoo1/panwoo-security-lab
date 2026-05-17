export function ComingSoonCard({
  eyebrow,
  title,
  description,
  meta,
  note,
  onClick
}: {
  eyebrow: string
  title: string
  description: string
  meta: string
  note?: string
  onClick?: () => void
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{eyebrow}</p>
        <span className="rounded-full border border-white/10 bg-white/[0.045] px-2 py-1 text-xs font-semibold text-slate-400">Coming soon</span>
      </div>
      <h3 className="mt-4 text-lg font-bold leading-snug text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-5 grid gap-1.5 text-xs font-medium text-slate-500">
        <span>{meta}</span>
        {note ? <span>{note}</span> : null}
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left shadow-[0_10px_30px_rgba(2,6,23,0.2)] transition-all hover:border-blue-400/25 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    )
  }

  return <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_10px_30px_rgba(2,6,23,0.2)]">{content}</article>
}
