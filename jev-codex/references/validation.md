# Validation and measured limits

Validated on 2026-09-22 with Node.js 24, agent-browser 0.38.1, local Chrome and Jev response model jev-1.13.0.

## This skill

- 15 offline behavior checks passed: malformed model responses, out-of-set choices, probability normalization, Score scale, secret blocking, call budgets, protected context retention, short-output bypass, allowlisted clicks, stale refs, no-progress stopping, input handoff, tab IDs, unknown evidence and advisory search filtering.
- Real API tests passed for context, search and review. The context specimen retained the error and relevant facts while reducing 313 characters to 178 in the latest run; earlier runs retained 213. This is character reduction on a synthetic specimen, not Codex token or latency savings. minChars was deliberately set to zero for this small test.
- Search correctly ranked the JavaScript SDK page first for a Node.js integration query, using supplied public documentation snippets. This validates reranking, not autonomous web retrieval.
- Review identified that “export succeeded” contradicts the supplied failure log. It made no automatic corrections.
- In actual local Chrome, one worker invocation performed two navigation clicks and handed off at the input field. After Codex-authored input, another invocation performed the next navigation and reached the independently checked result page. Screenshot was visually inspected.
- Actual browser tab switching selected the observed allowed t2 tab; continuous scrolling performed two downward increments and reached a DOM checkpoint. Those operations were tested without a Codex reasoning turn between actions.
- The final complete live suite made 10 API requests. Earlier validation runs made 13 additional requests while diagnosing/validating handoff behavior. One first-run assertion exposed only a reason-label issue: a low-confidence INPUT handoff was reported as uncertain_operation. The fix permits safe stopping regardless of confidence while preserving the confidence gate for execution.
- Skill frontmatter passed the skill-creator validator. Tests and original validation artifacts are retained in the workspace skill-development directory; they contain synthetic data, no API key.

## Prior exploratory benchmark, not a promise

The separate local benchmark compared batched versus serial Jev requests: task latency medians 2.24s versus 3.39s, approximately 34% less time on six small local browser scenarios. This did not measure this worker against Codex alone or demonstrate a general 5–10× speedup. The worker adds explicit scope checks and handoffs.

That benchmark also found high-confidence errors in arithmetic and multi-step path reasoning. Giving Jev computed intermediates improved 32/48 to 46/48 but did not eliminate incorrect numeric comparisons. This skill therefore keeps exact calculations and final deterministic checks in code.

## Unproven coverage

No general reliability claim for live sites, authenticated workflows, complex overlays, iframe/canvas, anti-bot pages, rapid DOM races, production transactions or long-horizon planning. Prompt-injection labeling and secret detection are heuristics, not security guarantees. The script has no Codex runtime hook and cannot erase existing conversation history. Model confidence thresholds are not calibrated on a representative production dataset.

## Supervisor extension — 2026-09-22

20 offline tests pass (15 existing + 5 supervisor tests), covering hard-constraint veto, unknown compliance, supported/unresolved objections, no forced winner, and invalid evidence. Two real Jev 1.13.0 requests tested private-sharing alternatives and prototype-storage tradeoffs. Public sharing was rejected; an unknown hosting service was deferred. The private plan had sound quality but did not clear the conservative confidence gate, so no plan was automatically recommended. Storage alternatives also produced no automatic recommendation. These are smoke cases, not evidence of general review accuracy or calibrated confidence. API latency was approximately 0.84s and 0.79s, excluding Codex preparation and interpretation.
