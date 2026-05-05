# 10. Codex Prompts

Codex에 바로 붙여 넣을 수 있는 프롬프트 모음입니다.

## 1. 전체 repo 파악

```text
AGENTS.md와 docs/harness 문서를 먼저 읽고, 이 repo의 구조를 요약해줘.
그 다음 master 관점에서 coder/qa/security에게 나눌 작업 단위를 제안해줘.
출력은 docs/harness/05_HANDOFF_PROTOCOL.md 형식으로 해줘.
```

## 2. master 호출

```text
$faust-master-orchestrator
현재 사용자 요청을 분석해서 작업 패킷을 작성해줘.
불명확한 부분은 합리적으로 가정하되 "가정"으로 표시해.
coder, qa, security 각각에게 넘길 handoff를 만들어줘.
```

## 3. coder 호출

```text
$faust-coder-implementation
아래 task packet을 기준으로 관련 파일을 수정해줘.
수정 전 관련 파일과 기존 패턴을 먼저 확인하고, 최소 변경으로 구현해.
완료 후 검증 명령을 실행하거나 실행하지 못한 이유를 남겨줘.

[TASK PACKET 붙여넣기]
```

## 4. qa 호출

```text
$faust-qa-validation
아래 coder result를 기준으로 검증해줘.
가능한 가장 좁은 테스트부터 실행하고, 실패하면 실패 원인과 재현 절차를 정리해줘.

[CODER RESULT 붙여넣기]
```

## 5. security 호출

```text
$faust-security-review
아래 변경사항의 보안 리스크를 검토해줘.
secret 노출, 인증/인가, 외부 입력, SSRF, command/file/template/SQL injection 가능성을 확인해.
실제 secret 값은 출력하지 말고 [REDACTED]로 처리해.

[변경 파일/요약 붙여넣기]
```

## 6. Discord bridge 문제 해결

```text
AGENTS.md와 docs/harness/08_DISCORD_VISIBLE_BRIDGE.md를 먼저 읽어줘.
현재 Discord 메시지 전송 스크립트가 HTTP 405를 반환한다.
scripts/send_as_bot.sh, agent-map.json, 관련 README를 확인해서
channel/thread endpoint 혼동, POST method, token redaction, error logging을 점검하고 수정해줘.
실제 token은 출력하지 마.
```

## 7. UI/UX 수정

```text
AGENTS.md를 먼저 읽어줘.
화면 전체 재작성은 하지 말고, 사용자가 지적한 영역만 최소 수정해줘.
수정 전 관련 component 구조와 기존 spacing/font-size 패턴을 확인해.
완료 후 변경 파일, 수정 이유, 수동 검증 viewport를 보고해줘.
```

## 8. 실패 로그 분석

```text
아래 로그를 분석해줘.
추측과 확인된 사실을 구분하고, 다음에 실행할 명령을 우선순위대로 제안해줘.
가능하면 qa handoff와 coder handoff를 함께 작성해줘.

[로그 붙여넣기]
```

## 9. 보안 검토 포함 구현

```text
기능 구현 후 security review까지 포함해서 진행해줘.
특히 secret, 인증/인가, 외부 입력, SSRF, command injection 가능성을 확인해.
테스트를 실행하지 못하면 이유와 사용자가 직접 실행할 명령을 남겨줘.
```

## 10. 최종 통합 보고

```text
master 관점에서 coder/qa/security 결과를 통합해 최종 보고서를 작성해줘.
완료한 일, 검증 결과, 보안 검토, 남은 리스크, 다음 작업을 구분해줘.
```
