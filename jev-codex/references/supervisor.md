# Plan supervisor

Run `node /path/to/jev-codex/scripts/jev.mjs supervisor --input job.json --output fresh-result.json`.

Job example:
```json
{
  "goal": "Share a skill only with invited collaborators",
  "constraints": [{"id":"privacy","text":"Repository must be private","hard":true}],
  "plans": [
    {"id":"public","text":"Publish a public GitHub repository", "objections":[{"id":"exposure","text":"Public access violates invitation-only sharing","remedy":"Use a private repository","evidenceIds":[]}]},
    {"id":"private","text":"Use a private GitHub repository; invite specified accounts; verify visibility and access before sharing", "objections":[{"id":"access","text":"The plan omits checking access permissions","remedy":"Check collaborator access","evidenceIds":[]}]}
  ],
  "evidence": []
}
```

Supply 1–6 plans, 1–8 constraints, 1–5 objections per plan and up to 30 evidence records. All objects need unique IDs within their list. Each objection needs text, a concrete remedy and evidenceIds (empty permits design-only assessment). Cite actual evidence; proposed performance or implementation claims are not verified facts. Keep total questions at most 128; smaller jobs are preferable. Hard defaults true; soft preferences use hard:false.

Result per plan: constraint pass/fail/unknown; objection supported/refuted/unresolved; quality sound/revise/reject/unknown; conservative verdict accept/revise/reject/defer. A confident hard violation vetoes acceptance; uncertain hard compliance defers. Unresolved objections prevent acceptance. Pairwise comparisons allow tie and unknown. A unique recommendation requires an accepted plan that confidently beats all others; otherwise recommended is null, not a failure.

Codex authors objection hypotheses and remedies; Jev classifies them against supplied facts. Returned objection text is not newly generated independent criticism. To reduce blind spots, cover goal fit, feasibility, cost/complexity, validation, reversibility and the strongest case against the favored plan. Built-in quality checks also inspect these dimensions, but are structured labels, not explanations. Missing objections can still miss defects. Jev and Codex can share errors; this is advisory second-pass scrutiny, not formal verification or an approval authority.

Codex must read the full result, answer material objections, and report what changed. A useful response: “A violates X; B remains uncertain because Y; choose revised C after checking Z.” Verify exact calculations with code. If pairwise preference conflicts with individual verdicts, investigate rather than force a ranking. Do not execute a plan just because it is accepted.
