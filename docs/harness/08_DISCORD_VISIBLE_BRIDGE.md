# 08. Discord Visible Bridge

## 목적

OpenHarness/Codex agent의 결과를 Discord thread에서 사람이 추적 가능하게 보여주기 위한 규칙입니다.

## 메시지 원칙

- 짧고 구조화합니다.
- agent persona는 표시하되, 내용은 실무적으로 씁니다.
- token, cookie, secret, raw Authorization header는 절대 출력하지 않습니다.
- 실패도 명확히 표시합니다.
- 너무 긴 diff는 붙이지 않고 파일 경로와 요약만 남깁니다.

## 권장 메시지 포맷

```md
**[master:TASK-001] 완고하며 주도적이고 교묘한 파우스트**

상태: planning
목표: ...
다음 담당: coder
확인 파일: ...
주의: secret 출력 금지
```

```md
**[coder:TASK-001] 냉철하고 똑똑한 파우스트**

상태: done
변경 파일:
- ...

검증:
- `pnpm build` → passed

다음 담당: qa
```

```md
**[qa:TASK-001] 위대하고 근엄한 파우스트**

상태: failed
실패 명령:
- `pnpm build`

원인:
- ...

다음 담당: coder
```

```md
**[security:TASK-001] 사랑스럽고 음험한 파우스트**

상태: review_done
High:
- 없음

Medium:
- ...

주의:
- token 로그 출력 금지 유지
```

## Bridge Payload 예시

```json
{
  "agent": "master",
  "display_name": "완고하며 주도적이고 교묘한 파우스트",
  "task_id": "TASK-001",
  "status": "planning",
  "thread_id": "${DISCORD_THREAD_ID}",
  "message": "목표와 handoff 요약"
}
```

## agent-map.json 예시

```json
{
  "master": {
    "display_name": "완고하며 주도적이고 교묘한 파우스트",
    "discord_id": "PASTE_MASTER_APP_OR_BOT_ID"
  },
  "coder": {
    "display_name": "냉철하고 똑똑한 파우스트",
    "discord_id": "PASTE_CODER_APP_OR_BOT_ID"
  },
  "qa": {
    "display_name": "위대하고 근엄한 파우스트",
    "discord_id": "PASTE_QA_APP_OR_BOT_ID"
  },
  "security": {
    "display_name": "사랑스럽고 음험한 파우스트",
    "discord_id": "PASTE_SECURITY_APP_OR_BOT_ID"
  }
}
```

## HTTP 405 점검 포인트

Discord API에서 405가 발생하면 다음을 확인합니다.

1. endpoint가 channel message endpoint인지 thread message endpoint인지
2. HTTP method가 POST인지
3. bot token 권한이 해당 channel/thread에 있는지
4. thread가 archived/locked 상태인지
5. application id와 bot user id를 혼동하지 않았는지
6. webhook endpoint와 bot endpoint를 혼동하지 않았는지

## 로그 redaction

로그 출력 전 다음 값을 마스킹합니다.

- `Authorization: Bot ...`
- `DISCORD_BOT_TOKEN`
- `.env` 값
- Supabase service role key
- GitHub token
- OpenAI API key

권장 표기:

```text
Authorization: Bot [REDACTED]
DISCORD_BOT_TOKEN=[REDACTED]
```
