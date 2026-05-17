import { StatusCard } from '../dashboard/StatusCard'

const walletAreas = [
  ['Portfolio Overview', 'Read-only balances and asset movement summary', 'Coming soon'],
  ['Wallet Monitor', 'Address-level monitoring without frontend secrets', 'Read-only required'],
  ['Strategy Runner', 'Automation status display only, no browser-side execution', 'Disabled'],
  ['Risk Guard', 'Policy checks before any future server-side action', 'Design needed'],
  ['Transaction Logs', 'Audit trail for future signed operations', 'Placeholder']
]

export function WalletPreview() {
  return (
    <section className="grid gap-4">
      <article className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-5 shadow-[0_18px_70px_rgba(2,6,23,0.22)]">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-blue-200">Security boundary</p>
        <h3 className="mt-3 text-xl font-bold text-white">No private keys in frontend</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          이 영역은 지갑 자동화 대시보드의 UI 뼈대만 제공합니다. 실제 구현은 read-only API, 권한 분리, 서버 측 signer 또는 하드웨어
          지갑 경계를 전제로 설계해야 합니다.
        </p>
      </article>
      <div className="grid gap-3 md:grid-cols-2">
        {walletAreas.map(([title, description, status]) => (
          <StatusCard
            eyebrow="Wallet Automation"
            title={title}
            description={description}
            status={status}
            meta="Mock UI only · no signing, sending, swapping, or key storage"
            tone="slate"
            key={title}
          />
        ))}
      </div>
    </section>
  )
}
