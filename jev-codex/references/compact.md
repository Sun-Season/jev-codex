# Assist Codex compact

Use context action `plan` then `audit` when preparing a continuation summary for a long task or an explicit compact request. This is a file-based workflow, not a host compaction hook. It cannot see unsupplied history, invoke or replace native compact, or erase messages already in context. Skip extra API work for tiny tasks unless explicitly requested.

## 1. Prepare original material and ask Jev for a plan

Codex supplies a faithful task ledger: current goal, user instructions and corrections, constraints/authorization, key decisions and reasons, completed work with evidence, pending work, failures, uncertainties, contradictory evidence, artifacts and next steps. Exclude private chain-of-thought and secrets. Include stable original file/message references. Do not pre-delete inconvenient facts. Mark critical items explicitly. Use files for large tool outputs before reading them into conversation.

```json
{
  "action":"plan",
  "goal":"Complete the export",
  "items":[
    {"id":"limit","kind":"constraint","source":"user-message:1","text":"Do not publish the report."},
    {"id":"result","kind":"failure","source":"run.log:12","text":"Export failed; retry is pending."},
    {"id":"a","source":"run.log:3","text":"Loaded input rows."},
    {"id":"b","source":"run.log:4","text":"Validated input rows."}
  ],
  "mergeGroups":[{"id":"prep","itemIds":["a","b"]}]
}
```

Call `node /path/to/jev-codex/scripts/jev.mjs context --input plan.json --output fresh-plan-result.json`.

Up to 40 items, 12,000 characters per item, required source; up to 16 proposed merge groups of 2–10 existing IDs. Codex proposes related groups, Jev judges compatibility. Jev classifies unprotected items keep/summarize/archive; uncertain answers keep. Protected goal/instruction/constraint/authorization/pending work/decision/failure/uncertainty/verification/artifact/code/contradiction items remain mandatory. A merge suggestion never overrides mandatory retention. Archive only means omission from the proposed working summary; originals remain in `.source.json`.

## 2. Codex writes the draft

Use the plan to write a concise summary; Jev does not generate free-form summaries. Preserve exact values, scope, permission boundaries, failed attempts and conflicting facts. Each summary entry includes one or more original sourceIds. Mandatory items may be paraphrased only without losing meaning. Merge compatible items while keeping meaningful differences. Do not impose a length target that drops critical information.

## 3. Audit against ALL original items

Submit the same goal and complete original items, including items marked archive, with action `audit` and the draft:

```json
"summary":[
  {"id":"limits","text":"Do not publish the report.","sourceIds":["limit"]},
  {"id":"state","text":"Export failed; retry remains pending.","sourceIds":["result"]},
  {"id":"prep","text":"Input rows loaded and validated.","sourceIds":["a","b"]}
]
```

Use a new output path. Up to 40 summary entries. The audit checks every original for coverage AND every summary entry for fidelity to its cited originals. Missing protected items, distorted claims or uncertain answers produce revision_required. If answers support the draft but confidence alone falls below the operational cutoff, needs_codex_review asks Codex to inspect those originals; it is not evidence the draft is wrong. Read `issues`, inspect the corresponding originals, and fix the draft; normally at most one follow-up audit. If unresolved or API fails, retain originals and clearly mark the summary unverified. Do not omit failed checks to get acceptance.

`ready_for_codex_check` is advisory, not proof. Codex verifies essential facts and then saves a human-readable continuation summary with original source mappings, the archive/audit file paths, pending work and next action. Use that file for subsequent handoff or deliberate rereads. Changes after audit require rechecking affected content. Report character counts only as text-size measurements; do not claim measured context-token savings. Native Codex compaction remains controlled by the host.

Legacy `context` without action still performs verbatim tool-output filtering; see data-modes.md. It is a preprocessing option, not the complete compact workflow.
