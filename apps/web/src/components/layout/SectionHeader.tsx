export function SectionHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <section className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-blue-300">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight tracking-normal text-white sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">{description}</p>
      </div>
    </section>
  )
}
