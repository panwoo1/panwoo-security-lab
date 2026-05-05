# 06. Task Packet Template

## Master가 agent에게 넘길 작업 패킷

```md
# Task Packet

## Metadata

- task_id:
- created_by:
- assigned_to:
- priority: high | medium | low
- status: pending
- repo:
- branch:

## Goal

한 문장으로 작업 목표를 작성합니다.

## Background

사용자 요청, 이전 로그, 현재 문제를 요약합니다.

## Files to Inspect

- `path/to/file`
- `path/to/another`

## Constraints

- secret 출력 금지
- destructive command 금지
- 기존 구조 유지
- 새 dependency 추가 시 사유 기록

## Implementation Notes

- 예상 수정 방향:
- 참고할 기존 패턴:
- 피해야 할 접근:

## Validation Plan

- 명령:
- 기대 결과:
- 수동 검증:

## Done When

- [ ] 구현 완료
- [ ] 테스트/빌드/타입 체크 중 가능한 검증 완료
- [ ] 실패 시 failure report 작성
- [ ] qa/security handoff 작성

## Handoff Target

- 다음 담당:
- 넘길 내용:
```

## Coder용 예시

```md
# Task Packet

## Metadata

- task_id: TASK-UI-001
- created_by: master
- assigned_to: coder
- priority: high
- status: pending
- repo: current
- branch: current

## Goal

프로필 영역과 인사이트 카드의 크기 불일치를 수정한다.

## Background

사용자가 모바일 홈 화면에서 프로필 닉네임 영역이 지나치게 크고, 아래 인사이트 카드와 간격/비율이 맞지 않는다고 지적했다.

## Files to Inspect

- `src/pages/HomePage.tsx`
- `src/components/ProfileCard.tsx`
- `src/components/InsightCard.tsx`

## Constraints

- 영어/한글 톤 수정은 하지 않는다.
- My 표기는 유지한다.
- 전체 UI 재작성 금지.
- 닉네임 영역 크기와 인사이트 카드 위치만 조정한다.

## Implementation Notes

- font-size, line-height, padding, margin-top 중심으로 수정한다.
- 부모 container의 height 고정값이 있으면 확인한다.

## Validation Plan

- `pnpm build`
- 모바일 viewport 390x844 기준 수동 확인

## Done When

- [ ] 닉네임 영역이 과도하게 커지지 않는다.
- [ ] 인사이트 카드가 살짝 아래로 내려간다.
- [ ] 기존 기능 변경 없음.
```

## Security용 예시

```md
# Task Packet

## Metadata

- task_id: TASK-SEC-001
- created_by: master
- assigned_to: security
- priority: high
- status: pending

## Goal

Discord bot bridge 스크립트가 token을 로그에 노출하지 않는지 검토한다.

## Files to Inspect

- `scripts/send_as_bot.sh`
- `.env.example`
- `agent-map.json`

## Constraints

- 실제 token 값 출력 금지
- Authorization header 로그 금지

## Validation Plan

- grep 기반 secret pattern 확인
- curl verbose 사용 시 header redaction 여부 확인

## Done When

- [ ] token 출력 위험 여부 확인
- [ ] 안전한 logging 방식 제안
```
