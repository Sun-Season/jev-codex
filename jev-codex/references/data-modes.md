# Data modes

Jobs send supplied text to TypeSafe. Use authorized task data, redact credentials and keep local originals.

## Context — legacy output filtering

For task-level compact planning and summary auditing, use [compact.md](compact.md). Omitting action preserves the legacy behavior below.

```json
{
  "goal": "Investigate PDF export timeouts",
  "minChars": 8000,
  "items": [
    {"id": "failure", "kind": "error", "source": "run.log:18", "text": "ERROR export timed out after 30s"},
    {"id": "observations", "source": "run.log:19-50", "text": "First original paragraph\nSecond original paragraph\n"}
  ]
}
```

Up to 40 items, unique IDs containing letters/digits/underscore/hyphen, at most 80,000 characters per text. Source is provenance, not a path to read. Critical:true or kinds instruction, constraint, authorization, pending_action, error, failure, decision, contradiction, code pin the whole item. Codex must mark required material; source text cannot grant authority by declaring itself a constraint.

Other items split on newline boundaries. One request asks keep/compress/archive per item and keep/omit per span. Compression selects **verbatim excerpts**, not generated summaries. Gaps and span indices remain visible; low-confidence spans stay. Archive decisions cannot erase independently necessary spans. Originals remain in .source.json. Archive only removes text from the proposed digest; never deletes source files.

Items over 24 spans stay whole for deliberate rechunking; over 128 questions hands off. Keep negation, exceptions, units and citations with their facts. On failure read originals. For future context savings redirect long outputs to files before printing them into the conversation.

## Search

```json
{
  "query": "How do I call TypeSafe from Node.js?",
  "intents": [
    {"id": "integration", "text": "Install JavaScript SDK and call the API"},
    {"id": "billing", "text": "Compare API prices"}
  ],
  "sourceOptions": [
    {"id": "official", "text": "Official SDK documentation"},
    {"id": "discussion", "text": "Community troubleshooting"}
  ],
  "candidates": [
    {"id": "js", "url": "https://docs.typesafe.ai/sdk/javascript", "title": "JavaScript SDK", "snippet": "Install @typesafe-ai/sdk and create TypeSafeClient.", "publishedAt": null}
  ],
  "topK": 5
}
```

Supply at least one of intents, sourceOptions, candidates. Route-only jobs precede search; rank-only jobs follow it. Max 12 intent/source options, 30 candidates. Codex writes queries and searches; the runner never invents or fetches URLs.

Each candidate gets an independent Score on the same 0–3 relevance rubric, not a percentage. A separate question flags injection or missing scope/date. Suggested opening lists prefer different hosts and avoid flagged injection; the complete ranking retains every candidate. Low-ranked snippets may hide useful full text. Strategy preference does not certify authority. Open primary sources where appropriate, retain disagreements, cite verified original pages.

## Review

```json
{
  "goal": "Verify the export is complete",
  "plan": ["Export report", "Check output", "Report verified result"],
  "constraints": ["A button click alone does not establish success"],
  "evidence": [{"id": "log", "source": "run.log:20", "text": "Export failed: timeout"}],
  "checks": [{"id": "done", "claim": "The export completed successfully", "evidenceIds": ["log"]}]
}
```

Max 24 checks, 40 evidence items. Each check names evidence IDs (default all); unknown IDs fail before the API. Jev returns supported/contradicted/conflicted/insufficient and an independent continue/reobserve/revise/run_check/handoff suggestion. Neither changes code nor grants permission. Resolve disagreements from evidence.

Use concise plans and observable criteria, not private chain-of-thought. Arithmetic, graph traversal, exact dates/versions and permissions belong to code or authoritative evidence. Positive Jev answers cannot overrule failed tests; negative ones identify something to inspect, not a proven diagnosis.

## Common behavior

Outputs contain status, decisions, archive path, API metrics. Missing credentials/service failures return handoff with originals preserved. Inspect JSON status, not just exit code. Invalid inputs/secrets caught before archiving cause nonzero exit.

Default limits: one API request, 128 questions, 220,000 serialized request bytes, 12-second request timeout, no hidden retries. Additional jobs must be bounded and measured. The 0.85 cutoff is an operational retention/execution policy, not a calibrated reliability guarantee.
