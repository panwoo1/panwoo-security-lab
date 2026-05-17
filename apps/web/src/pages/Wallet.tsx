import { SectionHeader } from '../components/layout/SectionHeader'
import { WalletPreview } from '../components/wallet/WalletPreview'

export function WalletPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Wallet automation"
        title="Read-only wallet operations design"
        description="자산 변화와 자동화 실행 기록을 추적할 수 있도록 설계하되, 브라우저에는 개인키나 서명 기능을 두지 않습니다."
      />
      <WalletPreview />
    </>
  )
}
