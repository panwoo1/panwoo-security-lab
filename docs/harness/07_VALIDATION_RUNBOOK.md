# 07. Validation Runbook

## 목적

agent가 “작업 완료”라고 말하기 전에 무엇을 확인해야 하는지 정합니다.

## 1. 프로젝트 타입 확인

### Node/TypeScript/React

```bash
cat package.json
```

우선순위:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

또는 package manager에 맞춰:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

### Python

```bash
ls
find . -maxdepth 2 -name "pyproject.toml" -o -name "requirements.txt"
```

우선순위:

```bash
python -m pytest
python -m compileall .
python -m unittest
```

### Docker/Compose

```bash
docker compose config
docker compose ps
```

주의:

- volume 삭제 금지
- production compose 실행 금지
- credential 출력 금지

## 2. 검증 결과 기록

```md
## Validation

### Commands

```bash
명령어
```

### Result

- status: passed | failed | skipped
- summary:
- logs:
```

## 3. 검증을 못 했을 때

```md
## Validation Skipped

- reason:
- missing dependency:
- environment constraint:
- user-run command:
```

## 4. UI 작업 수동 검증

```md
## UI Manual Check

- viewport:
- page:
- action:
- expected:
- actual:
- remaining issue:
```

## 5. API 작업 수동 검증

```md
## API Manual Check

- endpoint:
- method:
- auth required:
- request sample:
- expected status:
- actual status:
- notes:
```

## 6. Discord Bridge 검증

```bash
# dry-run 또는 echo mode가 있다면 우선 사용
./scripts/send_as_bot.sh --dry-run master "$DISCORD_THREAD_ID" "test"
```

확인 항목:

- channel endpoint와 thread endpoint 구분
- HTTP status 출력
- response body 출력
- Authorization header 미출력
- bot token 미출력
- thread id/channel id 혼동 여부

## 7. 실패 분석 템플릿

```md
## Failure Analysis

- command:
- error:
- likely cause:
- confirmed facts:
- unknowns:
- next fix:
```
