---
name: jev-codex
description: "将范围明确的连续浏览器导航、长工具输出取舍、搜索意图与结果筛选、计划和证据复核交给 TypeSafe Jev，Codex 负责规划、输入、复杂判断和验收。适用于多步网页操作、上下文过长、批量搜索筛选，或用户要求 Codex 与 Jev 分工协作。"
---

# Jev × Codex

Use Jev as a bounded decision worker. Codex sets goals, supplies observations and permitted choices, handles complex reasoning and validates outcomes. Code owns calculations, exact comparisons, authorization boundaries and execution. Confidence is not proof; do not promise a fixed speedup.

## Choose the mode

| Mode | Delegate | Return to Codex |
|---|---|---|
| `browser` | Allowlisted clicks, navigation, site tabs, scrolling and observed browser-tab switching | Input/login, uploads, consequential actions, complex decisions, stale/uncertain state, screenshot acceptance |
| `context` | Keep/compress/archive decisions over original tool-output spans | Ambiguous or protected material; synthesis beyond verbatim excerpts |
| `search` | Select supplied query interpretations/source strategies; score supplied search results | Execute search, open sources, check dates/claims and write cited conclusions |
| `review` | Check claims against evidence; recommend a bounded next step | Verify alerts, change plan/code, run exact tests and accept the outcome |

For browser work read [references/browser.md](references/browser.md). For other modes read [references/data-modes.md](references/data-modes.md). Read only the relevant reference; both contain job schemas.

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

## Handoff rules

Low confidence, missing evidence, invalid responses, exhausted budgets, network failure and unchanged pages return to Codex. Keep originals and continue locally instead of repeatedly retrying. Default confidence cutoffs are operational settings, not calibrated guarantees. Unused speculative answers cannot authorize actions.

The browser worker never types or turns model text into selectors, URLs, JavaScript or shell commands. It selects observed references allowed by Codex's contract. Freshness checks precede execution; explicit predicates check the checkpoint. Codex still inspects screenshots and actual outcomes. Neither a website nor Jev can extend the allowlist or grant permission. A handoff alone does not require asking the user again.

## Validation

See [references/validation.md](references/validation.md) for tested coverage. For protocol changes use the typesafe-ai skill if available, or consult the [official API reference](https://docs.typesafe.ai/api.md).

Run `node --test scripts/test.mjs` and the skill-creator validator after changes. Report speed/usage savings only when measured. Character reduction is not measured Codex token savings. This is a workflow helper, not a native Codex runtime hook.
