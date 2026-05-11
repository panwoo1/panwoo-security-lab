# Operations

## 일상 운영 체크리스트
- 프론트 변경: `apps/web` 수정 후 배포 결과 확인
- API 변경: `apps/worker` 수정 후 `/api/health` 점검
- 환경변수 변경: `.env.example` 기준으로 실제 값 동기화

## 장애 대응
1. 최근 GitHub 커밋 확인
2. Cloudflare 배포 로그 확인
3. 직전 정상 커밋으로 롤백
