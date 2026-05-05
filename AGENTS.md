# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 5. Persistent Work Log

For this workspace, always consult the local Codex work log before planning or editing:

- Work log path: `/home/codespace/.codex/memories/PanwooSecurityLab-worklog.md`
- At the start of each Codex session or task, read the latest entries if the file exists.
- At the end of each completed task, append a dated entry with:
  - user request summary
  - files changed
  - validation commands and results
  - known risks or follow-ups
- Keep entries concise and factual. Do not include secrets, tokens, private credentials, or long command logs.

## 6. Local Agent Routing

For every task in this workspace, apply the local agent profiles automatically:

- Read `.agents/agent-map.json` before choosing a role.
- Select the local profile based on the task:
  - planning, decomposition, handoff, or task splitting → `.agents/agents/master.md`
  - implementation, bug fix, refactor, UI/API/code changes → `.agents/agents/coder.md`
  - validation, tests, reproduction, failure analysis, or regression checks → `.agents/agents/qa.md`
  - auth, authorization, secrets, external input, SSRF, command/file/template/SQL injection, Docker/infra security → `.agents/agents/security.md`
- Read the selected profile and follow its operating rules.
- If multiple roles apply, use the smallest useful sequence: master first when planning is needed, coder for implementation, qa for validation, and security for security-sensitive changes.
- Apply this routing silently unless the user asks which role is being used.
- Do not spawn runtime sub-agents unless the user explicitly asks for sub-agents, delegation, or parallel agent work.

## 7. Local Skill Auto-Use

When a local agent profile is selected through `.agents/agent-map.json`, also read and apply its mapped local skill:

- `master` → `.agents/skills/faust-master-orchestrator/SKILL.md`
- `coder` → `.agents/skills/faust-coder-implementation/SKILL.md`
- `qa` → `.agents/skills/faust-qa-validation/SKILL.md`
- `security` → `.agents/skills/faust-security-review/SKILL.md`

Do not wait for the user to explicitly name the skill if the task clearly matches one of these local roles.
