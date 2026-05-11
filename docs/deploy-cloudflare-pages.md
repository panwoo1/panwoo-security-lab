# Cloudflare Pages 배포

1. Cloudflare Dashboard → Pages → Create project
2. GitHub 저장소 연결
3. Build settings
   - Framework preset: Vite
   - Root directory: `apps/web`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. 환경변수 등록
   - `VITE_API_BASE_URL`
5. 첫 배포 후 도메인 확인
