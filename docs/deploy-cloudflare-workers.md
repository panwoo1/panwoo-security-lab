# Cloudflare Workers 배포

## 브라우저 기반 준비
1. `apps/worker/wrangler.toml.example`를 `wrangler.toml`로 복사
2. 네임스페이스/바인딩 값 설정

## GitHub Actions 기반 배포(권장)
- GitHub Secrets
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- Actions에서 `wrangler deploy` 실행

## 직접 배포(로컬 가능 시)
```bash
cd apps/worker
npm run deploy
```
