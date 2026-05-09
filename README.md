# PanwooSecurityLab - Browser-Only Deployment Template

제한된 네트워크(예: 80/443만 허용)에서도 브라우저 중심으로 운영 가능한 무료 우선 아키텍처 템플릿입니다.

## 목표
- GitHub 기반 코드/운영
- Cloudflare Pages + Workers 조합
- SSH 없이 배포 가능
- 모바일 환경에서도 GitHub Web Editor/Codex로 수정 가능

## 구조
```txt
/
├─ apps/
│  ├─ web/
│  └─ worker/
├─ docs/
├─ .github/workflows/
├─ .env.example
├─ README.md
└─ package.json
```

자세한 내용은 `docs/` 문서를 확인하세요.
