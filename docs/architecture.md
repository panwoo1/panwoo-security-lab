# Architecture

## 목표
- GitHub 저장소 중심 개발/운영
- Cloudflare Pages(프론트) + Workers(API) 조합
- SSH 없이 브라우저 기반 운영

## 구성
- `apps/web`: Vite + React 프론트엔드 (Cloudflare Pages)
- `apps/worker`: Cloudflare Workers API
- 저장소 선택지: KV / D1 / Supabase

## 배포 흐름
1. GitHub Web Editor 또는 모바일 브라우저에서 코드 수정
2. GitHub Push
3. Cloudflare Pages/Workers 또는 GitHub Actions 연동으로 자동 배포
