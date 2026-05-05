# 05. Handoff Protocol

## 목적

agent 간 전달은 사람이 읽을 수 있고, Discord/OpenHarness bridge가 처리할 수 있는 구조여야 합니다.

## 기본 원칙

- 누가 누구에게 넘기는지 명확히 합니다.
- task_id를 유지합니다.
- 목표와 완료 기준을 구분합니다.
- secret은 절대 포함하지 않습니다.
- 실패 상태도 정상적인 handoff로 취급합니다.

## Markdown Handoff

```md
## Handoff

- from:
- to:
- task_id:
- status: pending | in_progress | blocked | done | failed
- goal:
- context:
- changed_files:
- commands_run:
- validation_result:
- risks:
- next_action:
```

## JSON Handoff

```json
{
  "type": "agent_handoff",
  "from": "master",
  "to": "coder",
  "task_id": "TASK-001",
  "status": "pending",
  "goal": "구현 목표",
  "context": [
    "현재 상황",
    "관련 로그 또는 사용자의 요구사항 요약"
  ],
  "files_to_inspect": [
    "path/to/file"
  ],
  "changed_files": [],
  "commands_run": [],
  "validation_result": {
    "status": "not_run",
    "reason": "아직 구현 전"
  },
  "constraints": [
    "secret 출력 금지",
    "destructive command 금지"
  ],
  "done_when": [
    "완료 기준 1",
    "완료 기준 2"
  ],
  "risks": [
    "예상 리스크"
  ],
  "next_action": "coder가 관련 파일을 수정하고 검증 명령을 실행한다."
}
```

## 상태값

| status | 의미 |
|---|---|
| pending | 아직 시작 전 |
| in_progress | 진행 중 |
| blocked | 외부 정보/환경 문제로 막힘 |
| done | 완료 |
| failed | 시도했지만 실패 |

## Discord 메시지용 짧은 포맷

Discord thread에 올릴 때는 너무 길지 않게 아래 형식을 사용합니다.

```md
**[handoff:TASK-001] master → coder**

목표: ...
확인 파일: ...
완료 기준: ...
주의: secret 출력 금지 / destructive command 금지
```

## 실패 handoff 예시

```json
{
  "type": "agent_handoff",
  "from": "qa",
  "to": "coder",
  "task_id": "TASK-004",
  "status": "failed",
  "goal": "빌드 실패 수정",
  "context": [
    "pnpm build 실행 중 TypeScript error 발생",
    "RecipeDetailPage.tsx에서 undefined 가능성"
  ],
  "commands_run": [
    "pnpm build"
  ],
  "validation_result": {
    "status": "failed",
    "summary": "TS2532: Object is possibly undefined"
  },
  "next_action": "coder가 null guard를 추가하고 다시 build를 실행한다."
}
```
