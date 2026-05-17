import type { NewsItem } from '../../generated-content'

export function NewsCard({ item, formatDate }: { item: NewsItem; formatDate: (value: string) => string }) {
  const regionLabel = item.region === 'domestic' ? '국내' : '글로벌'
  const regionClass =
    item.region === 'domestic'
      ? 'border-blue-400/25 bg-blue-400/10 text-blue-200'
      : 'border-white/10 bg-white/[0.045] text-slate-300'

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_10px_30px_rgba(2,6,23,0.18)] transition-all hover:-translate-y-px hover:border-blue-400/30 hover:bg-white/[0.055] sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold leading-none">
        <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1.5 text-slate-300">{item.source}</span>
        <span className={`rounded-full border px-2.5 py-1.5 ${regionClass}`}>{regionLabel}</span>
        <span className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1.5 text-slate-400">{formatDate(item.published)}</span>
      </div>
      <h3 className="text-[1.08rem] font-bold leading-snug tracking-normal text-white sm:text-[1.22rem]">
        <a
          className="text-white transition-colors hover:text-blue-200 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          {item.title}
        </a>
      </h3>
      <p className="m-0 overflow-hidden text-[0.94rem] leading-6 text-slate-400 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
        {item.summary}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        <a
          className="rounded-full border border-blue-400/25 bg-blue-400/10 px-3 py-1.5 text-sm font-semibold text-blue-200 transition-all hover:border-blue-300/40 hover:bg-blue-400/15 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          원문 열기
        </a>
        {item.translateUrl ? (
          <a
            className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-sm font-semibold text-slate-300 transition-all hover:border-blue-400/25 hover:bg-white/[0.06] hover:text-blue-200 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
            href={item.translateUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            번역 보기
          </a>
        ) : null}
      </div>
    </article>
  )
}
