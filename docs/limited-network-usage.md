# 제한된 네트워크 환경 운영 가이드

80/443 포트만 허용되는 환경에서도 아래 방식으로 운영 가능:

1. GitHub 웹 UI에서 코드 수정
2. Pull Request 또는 main 브랜치 푸시
3. Cloudflare Pages 자동 빌드
4. Workers는 GitHub Actions 또는 Cloudflare Dashboard에서 배포

SSH/원격 터미널 접속 없이 브라우저만으로 관리 가능.
