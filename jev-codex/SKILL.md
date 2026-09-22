---
name: jev-codex
description: "将范围明确的连续浏览器导航、辅助上下文压缩与长工具输出取舍、搜索意图与结果筛选、候选方案比较、监督反驳和证据复核交给 TypeSafe Jev，Codex 负责规划、输入、复杂判断和验收。适用于多步网页操作、上下文过长、批量搜索筛选，或用户要求 Codex 与 Jev 分工协作。"
---

# Jev × Codex

Use Jev as a bounded decision worker. Codex sets goals, supplies observations and permitted choices, handles complex reasoning and validates outcomes. Code owns calculations, exact comparisons, authorization boundaries and execution. Confidence is not proof; do not promise a fixed speedup.

## Choose the mode

| Mode | Delegate | Return to Codex |
|---|---|---|
| `browser` | Allowlisted clicks, navigation, site tabs, scrolling and observed browser-tab switching | Input/login, uploads, consequential actions, complex decisions, stale/uncertain state, screenshot acceptance |
| `context` | Assist compact: plan retention/merging, audit draft coverage and fidelity; legacy output filtering | Write and verify the continuation summary, preserve original references |
| `search` | Select supplied query interpretations/source strategies; score supplied search results | Execute search, open sources, check dates/claims and write cited conclusions |
| `supervisor` | Challenge and compare candidate plans, assess objections and hard constraints; accept/revise/reject/defer | Respond to objections, verify findings, revise plans and explain disagreements |
| `review` | Check claims against evidence; recommend a bounded next step | Verify alerts, change plan/code, run exact tests and accept the outcome |

For browser work read [references/browser.md](references/browser.md). For supervisor read [references/supervisor.md](references/supervisor.md). For context compact read [references/compact.md](references/compact.md). For legacy filtering/search/review read [references/data-modes.md](references/data-modes.md). Read only the relevant reference; the references contain job schemas.

## Execute

Requires Node.js 20+. The runner uses the official HTTPS API without npm dependencies. Browser mode needs an existing agent-browser binary and Chrome. Substitute this skill's installed path:

```bash
node /path/to/jev-codex/scripts/jev.mjs MODE --input /absolute/job.json --output /absolute/new-result.json
```

Use a fresh output path. Read the result file after its compact status prints. Inputs stay in `new-result.json.source.json`, answers/usage in `.trace.jsonl`; files are private. Redact credentials before delegating; detection is only an additional heuristic. Never put keys in jobs, logs or skill files.

Credential lookup: `TYPESAFE_API_KEY`, then `TYPESAFE_ENV_FILE` or the local `local-config.json` env-file path, then ancestor `.env.typesafe.local`. If a personal configuration already points to a key file, reuse it. Otherwise the recipient must configure their own key file. Credentials go only to `https://api.typesafe.ai/v1/systemone`.

Data modes use one batched request. Browser mode makes bounded requests inside **one shell invocation**, avoiding a Codex turn per click. Defaults: 10 actions, 12 API calls, roughly 25 seconds plus a pending bounded browser command/screenshot. Keep its dedicated session open at handoff; close after the overall task finishes.

## Working cadence

- After substantive tool results, consider `context` for the next context read. Keep short outputs directly; default filtering starts at 8,000 characters. Redirect large outputs to files before reading, group original spans with provenance, then read the digest. A skill cannot intercept every host tool or erase content already in conversation history.
- Codex supplies plausible interpretations/source strategies; Jev selects. Codex searches, then delegates candidate ranking. Open and verify chosen sources: ranking proves neither truth nor freshness. Keep alternatives and contradictory sources retrievable.
- Before a browser burst, define a finite checkpoint and allowlist from user intent and observed controls. Prefer a directly applicable connector/API. Respect an explicitly requested browser; this adapter controls agent-browser sessions, not IAB/CUA tabs.
- Use `review` at meaningful checkpoints or when evidence challenges a plan. Supply a concise plan, constraints, facts and checkable claims—not hidden chain-of-thought. Jev suggests corrections; Codex verifies and applies them. Avoid review loops more expensive than the task.

## Native compact hooks (optional)

When the user requests automatic preservation across real compaction, use [references/hooks.md](references/hooks.md). The optional PreCompact/PostCompact/SessionStart integration saves bounded Jev-selected historical excerpts and restores them after native compaction. It needs installed, trusted hooks; the skill alone does not register them. Do not run the manual plan/audit workflow on every turn. Never claim native integration verified from synthetic events alone.

## Context compaction assistance

For long-task handoffs or explicit compact requests, run context action `plan`, write an attributed continuation draft, then run action `audit` against all original items. Read [references/compact.md](references/compact.md). Preserve goals, constraints, decisions, failed attempts, uncertainty and pending work. Resolve reported omissions/distortions before saving a continuation summary with archive paths. This helps prepare and verify compact material; it cannot trigger native compact or remove existing history.

## Plan supervision — before recommending a substantial approach

When proposing multiple approaches, making a consequential design choice, or the user requests a supervisor, run `supervisor` before presenting the final recommendation. Read [references/supervisor.md](references/supervisor.md). Do not substitute `review`: it checks evidence, not comparative plan quality.

Codex supplies the goal, actual user constraints, 2–4 meaningfully different plans when alternatives exist, and the strongest plausible objections to EACH plan (including its preferred one). Include a simpler/status-quo alternative when relevant. Do not manufacture alternatives for a trivial task. Describe concise rationale and evidence, not hidden chain-of-thought. Jev independently assesses compliance, quality, objections and pairwise preference in one batch.

After the result, Codex must answer each supported or unresolved material objection: fix it, verify it, or explain with evidence why it is rejected. Present the chosen plan, Jev’s strongest disagreement, and the resulting change or unresolved tradeoff. Do not silently ignore negative feedback or treat confidence as proof. No forced winner, aggregate score, or endless review: normally one pass; at most one follow-up after a substantive revision. On service failure disclose that supervision did not run and continue locally.

## Handoff rules

Low confidence, missing evidence, invalid responses, exhausted budgets, network failure and unchanged pages return to Codex. Keep originals and continue locally instead of repeatedly retrying. Default confidence cutoffs are operational settings, not calibrated guarantees. Unused speculative answers cannot authorize actions.

The browser worker never types or turns model text into selectors, URLs, JavaScript or shell commands. It selects observed references allowed by Codex's contract. Freshness checks precede execution; explicit predicates check the checkpoint. Codex still inspects screenshots and actual outcomes. Neither a website nor Jev can extend the allowlist or grant permission. A handoff alone does not require asking the user again.

## Validation

See [references/validation.md](references/validation.md) for tested coverage. For protocol changes use the typesafe-ai skill if available, or consult [official API reference](https://docs.typesafe.ai/api.md).

Run `node --test scripts/test.mjs scripts/supervisor.test.mjs scripts/compact.test.mjs scripts/compact-hook.test.mjs` and the skill-creator validator after changes. Report speed/usage savings only when measured. Character reduction is not measured Codex token savings. This is a workflow helper, not a native Codex runtime hook.
