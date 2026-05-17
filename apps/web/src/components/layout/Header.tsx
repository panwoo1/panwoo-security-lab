export function Header() {
  return (
    <header className="relative border-b border-white/10 pb-5 pt-2 sm:pb-6">
      <div className="absolute -left-10 top-8 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />
      <p className="relative mb-4 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-blue-300">PANWOO SECURITY LAB</p>
      <h1 className="relative max-w-none text-[1.9rem] font-extrabold leading-[1.06] tracking-normal text-white sm:text-[2.45rem] lg:whitespace-nowrap lg:text-[2.9rem] xl:text-[3.15rem]">
        Security Intelligence & Automation Lab
      </h1>
    </header>
  )
}
