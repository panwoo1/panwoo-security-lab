export function NewsToolbar({
  query,
  resultCount,
  totalCount,
  label,
  placeholder,
  onQueryChange
}: {
  query: string
  resultCount: number
  totalCount: number
  label: string
  placeholder: string
  onQueryChange: (query: string) => void
}) {
  return (
    <section className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 shadow-[0_10px_30px_rgba(2,6,23,0.18)] sm:p-4 lg:grid-cols-[minmax(280px,480px)_minmax(0,1fr)] lg:items-center">
      <input
        aria-label={label}
        className="min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 text-sm font-medium text-white outline-none transition-all placeholder:font-normal placeholder:text-slate-500 focus:border-blue-400/40 focus:bg-slate-950 focus-visible:ring-2 focus-visible:ring-blue-400/40"
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={query}
      />
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 lg:text-right">
        {resultCount} / {totalCount} items
      </p>
    </section>
  )
}
