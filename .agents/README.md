# Local Agent Profiles

이 디렉터리는 이 repo에서 Codex 작업을 역할 기반으로 나누기 위한 로컬 agent 정의입니다.

## Agents

- `master`: 요청 분석, 작업 분해, handoff 작성
- `coder`: 구현, 수정, 리팩터링
- `qa`: 검증, 재현, 회귀 확인
- `security`: secret, 입력 검증, SSRF, command/file/template/SQL injection 검토

## Files

- `agent-map.json`: agent id, 표시명, profile, skill, 필수 문서 매핑
- `agents/*.md`: 각 agent의 행동 규칙과 출력 형식
- `skills/*/SKILL.md`: Codex skill 정의

## Usage

작업을 시작할 때는 `AGENTS.md`를 먼저 읽고, 필요한 역할에 맞는 profile을 함께 적용합니다.

예시:

```text
Use .agents/agents/master.md and create task packets for this request.
```

구현이 필요한 경우:

```text
Use .agents/agents/coder.md and implement the task packet.
```

검증이 필요한 경우:

```text
Use .agents/agents/qa.md and validate the coder result.
```

보안 검토가 필요한 경우:

```text
Use .agents/agents/security.md and review the changed files.
```
