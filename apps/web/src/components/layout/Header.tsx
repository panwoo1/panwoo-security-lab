export function Header() {
  return (
    <header className="relative border-b border-white/10 pb-6 pt-2 sm:pb-7">
      <div className="absolute -left-10 top-8 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />
      <p className="relative mb-4 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-blue-300">PANWOO SECURITY LAB</p>
      <h1 className="relative max-w-4xl text-[2rem] font-extrabold leading-[1.06] tracking-normal text-white sm:text-[2.65rem] lg:text-[3.15rem]">
        Security Intelligence & Automation Lab
      </h1>
      <p className="relative mt-4 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg">
        국내외 보안 이슈, 리서치 노트, AI 에이전트 실행 상태, 자동화 실험 로그를 한 곳에서 추적하는 개인 보안 연구소
        대시보드입니다.
      </p>
    </header>
  )
}
