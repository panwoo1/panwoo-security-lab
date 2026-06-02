# PanwooSecurityLab

## 목표
- `assets/data/security-news.json` 기반 보안 뉴스 탭 제공
- `content/notes` 기반 블로그 탭 제공
- Cloudflare Workers API와 Supabase 연동 유지
- GitHub Actions로 뉴스 데이터 주기 업데이트

## 구조
```txt
/
├─ apps/
│  ├─ web/        # Vite + React frontend
│  └─ worker/     # Cloudflare Worker API
├─ assets/data/   # security-news.json source
├─ content/notes/ # blog markdown source
├─ docs/
├─ scripts/
├─ .github/workflows/
├─ .env.example
├─ README.md
└─ package.json
```

## 개발

```bash
npm install
npm run dev:web
```

프론트는 운영 환경에서 Worker 콘텐츠 API(`/api/news`, `/api/posts`, `/api/posts/:slug`)를 사용합니다.
`dev:web` 단독 실행 중 API가 없으면 개발 모드에서만 생성 콘텐츠 파일을 fallback으로 읽습니다.
Worker까지 포함해 확인하려면 `npm run dev:worker`를 실행합니다. 이 명령은 Vite dist를 먼저 만들고 루트 `wrangler.toml`의 assets 바인딩으로 Worker를 띄웁니다.

## 빌드

```bash
npm run build
```

`scripts/generate-web-content.mjs`가 뉴스와 블로그 원본을 `apps/web/src/generated-content.ts`와 `apps/worker/src/generated-content.ts`로 생성합니다.

## Trading research and paper trading

Worker에 코인 시장 조사와 paper trading 준비 기능이 추가되어 있습니다. 기본 목표는 데이터 수집, AI/mock 요약 저장, 전략 신호 생성, 가상 거래 기록까지이며 실거래 주문은 구현되어 있지 않습니다.

### Supabase

`supabase/schema.sql`을 Supabase SQL editor에서 적용합니다. 주요 테이블은 `market_candles`, `market_tickers`, `market_research`, `ai_research_notes`, `strategy_signals`, `paper_trades`, `risk_logs`, `system_jobs`입니다.

### Cloudflare env/secrets

실제 값은 GitHub에 커밋하지 말고 Cloudflare secret/var로 설정합니다.

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put ADMIN_TOKEN
```

쓰기 권한이 RLS로 막혀 있으면 Worker 전용 secret으로 `SUPABASE_SERVICE_ROLE_KEY`를 사용할 수 있습니다. 이 값은 프론트엔드나 `VITE_*` 변수에 넣으면 안 됩니다.

선택 설정:

```txt
TRADING_MARKETS=KRW-BTC,KRW-ETH,KRW-XRP
TRADING_CANDLE_INTERVAL=minutes5
TRADING_ORDER_KRW=10000
MAX_TRADE_KRW=50000
DAILY_MAX_TRADES=8
DAILY_MAX_LOSS_RATE=0.03
ENABLE_REAL_TRADING=false
```

### API

Read-only:

- `GET /api/trading/health`
- `GET /api/trading/markets`
- `GET /api/trading/candles?market=KRW-BTC&interval=minutes5`
- `GET /api/trading/research/latest`
- `GET /api/trading/signals/latest`
- `GET /api/trading/paper-trades`

Admin token required:

- `POST /api/trading/paper-trades/execute`
- `POST /api/admin/trading/run-collector`
- `POST /api/admin/trading/run-analysis`

Admin 요청은 `Authorization: Bearer <ADMIN_TOKEN>` 또는 `X-Admin-Token` 헤더를 사용합니다.

### Cron

`wrangler.toml.example`에 5분 수집, 1시간 분석, 1일 리포트용 cron 예시가 있습니다. 현재 `wrangler.toml`은 변경하지 않아 기존 환경을 깨지 않습니다.

자세한 구조와 실거래 연결 전 주의사항은 `docs/trading-architecture.md`를 참고하세요.

### Live trading safety preparation

실거래 준비용 안전 인프라는 추가되어 있지만, 기본값은 여전히 실거래 비활성 상태입니다. Upbit signed client 구조는 live guard 뒤에 있으며 mock exchange 테스트 경로를 우선 사용합니다.

추가 schema:

```txt
supabase/trading-live-schema.sql
```

추가 admin API:

- `GET /api/trading/order-intents`
- `POST /api/trading/order-intents/:id/approve`
- `POST /api/trading/order-intents/:id/reject`
- `POST /api/trading/kill-switch/enable`
- `POST /api/trading/kill-switch/disable`

모두 `ADMIN_TOKEN`이 필요합니다. 안전 테스트는 다음 명령으로 실행합니다.

```bash
npm test --workspace worker
```

실거래 활성화 전 체크리스트, atomic idempotency key 규칙, kill switch 절차, Supabase RPC 기반 rate limit은 `docs/live-trading-safety.md`에 정리되어 있습니다.
