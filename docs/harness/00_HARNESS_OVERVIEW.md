# 00. Harness Overview

## 목적

이 harness는 Codex agent가 repo 안에서 다음 방식으로 안정적으로 일하도록 만드는 운영 지침입니다.

- repo-aware 작업
- 역할 기반 분업
- visible handoff
- 검증 중심 작업
- 보안 리스크 통제
- Discord/OpenHarness bridge 연동 가능성 확보

## 전체 흐름

```text
User Request
  ↓
master
  - 요구사항 해석
  - repo 상태 파악
  - 작업 단위 분리
  - coder / qa / security handoff 생성
  ↓
coder
  - 구현
  - 최소 변경
  - 자체 빌드/타입 체크
  ↓
qa
  - 테스트
  - 재현 절차 확인
  - 회귀 리스크 확인
  ↓
security
  - secret 노출 확인
  - 입력/권한/인증/인가 점검
  - 위험 명령 및 외부 접근 확인
  ↓
master
  - 결과 통합
  - 사용자에게 최종 보고
```

## 왜 이렇게 나누는가

agent가 한 번에 모든 것을 처리하면 다음 문제가 생깁니다.

- repo 구조를 제대로 보지 않고 수정
- 테스트 없이 성공처럼 보고
- 보안 검토 누락
- Discord thread에서 누가 무엇을 했는지 추적 불가
- 실패 시 재시도 포인트 불명확

따라서 각 역할은 결과를 구조화해서 다음 agent에게 넘깁니다.

## 핵심 원칙

### 1. Legibility first

agent가 무슨 판단을 했는지 사람이 읽을 수 있어야 합니다.

### 2. Small patch first

한 번에 큰 재작성보다 작은 변경과 검증을 우선합니다.

### 3. Test or explain

테스트를 실행하거나, 실행하지 못한 이유와 대체 검증을 남깁니다.

### 4. Security never implicit

secret, 인증, 권한, 외부 입력, command execution은 항상 명시적으로 검토합니다.

### 5. Handoff is an artifact

대화 중간 설명이 아니라 Markdown/JSON 형태로 남겨서 재사용할 수 있어야 합니다.

## 최소 산출물

각 작업은 아래 중 하나 이상을 남깁니다.

- patch
- test result
- failure report
- security review
- handoff JSON
- final summary

## 파일 구성

| 파일 | 목적 |
|---|---|
| `AGENTS.md` | Codex가 repo 작업 전 읽는 기본 지침 |
| `01_MASTER_AGENT.md` | master 역할 상세 지침 |
| `02_CODER_AGENT.md` | coder 역할 상세 지침 |
| `03_QA_AGENT.md` | qa 역할 상세 지침 |
| `04_SECURITY_AGENT.md` | security 역할 상세 지침 |
| `05_HANDOFF_PROTOCOL.md` | 역할 간 전달 포맷 |
| `06_TASK_PACKET_TEMPLATE.md` | agent에게 넘길 작업 패킷 템플릿 |
| `07_VALIDATION_RUNBOOK.md` | 테스트/검증 절차 |
| `08_DISCORD_VISIBLE_BRIDGE.md` | Discord 출력 규칙 |
| `09_REVIEW_CHECKLIST.md` | PR/변경 검토 체크리스트 |
| `10_CODEX_PROMPTS.md` | Codex에 바로 붙여 넣을 프롬프트 |
