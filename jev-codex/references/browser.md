# Browser bursts

Uses agent-browser, not the original jev-ultrafast package. If the user specifies an IAB/CUA tab, use that tool; do not silently substitute browsers.

## Contract

```json
{
  "goal": "Open documentation and stop at the API search input for Codex to fill.",
  "session": "jev-api-docs",
  "url": "https://docs.example.com/",
  "allowedOrigins": ["https://docs.example.com"],
  "allowedClicks": [
    {"role": "link", "name": "Documentation"},
    {"role": "link", "name": "API reference"},
    {"role": "tab", "name": "JavaScript"}
  ],
  "allowedTabUrls": [],
  "successChecks": [{"type": "textIncludes", "value": "API reference search"}],
  "maxActions": 10,
  "maxCalls": 12,
  "maxMs": 25000,
  "minConfidence": 0.85,
  "allowScroll": true,
  "screenshot": true
}
```

Example URL/labels are placeholders: use observed real controls. Origins are exact scheme/host/port, no trailing slash. Click roles: button, link, tab, menuitem. Names match exactly; missing targets cause handoff. Links must have a unique observed label, stay within origins, and not download or open a new window.

Use an owned `jev-...` session. Omit `url` to resume after Codex fills input. `allowedTabUrls` permits switching only to existing observed stable tab IDs with exactly matching URLs; the worker does not create tabs. Never reuse another task's session.

Checkpoint checks are ANDed; supported types: textIncludes, urlEquals, urlStartsWith. These observations do not prove the whole task. Passing returns checksPassed:true with status:handoff for Codex acceptance. Model-only CHECKPOINT returns checksPassed:false if predicates did not pass.

Supported actions: click, bounded scroll, 200ms wait, allowed tab switch. Input/select/login/upload/complex judgment returns to Codex. Consequential labels (send/pay/publish/delete/confirm etc.) also return, even if the overall task authorizes them. Do not ask the user again merely because the worker handed off.

## Configuration

Optional local-config.json contains paths only:

```json
{
  "envFile": "/path/to/.env.typesafe.local",
  "browserBin": "/path/to/agent-browser",
  "browserExecutable": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
}
```

Overrides: TYPESAFE_ENV_FILE, AGENT_BROWSER_BIN, AGENT_BROWSER_EXECUTABLE_PATH. Never store a literal key here. The worker does not install browsers or modify the user's normal Chrome profile.

At handoff inspect reason, screenshot and named session. Provide authorized input or investigate; then submit a new contract with fresh output path. Close only that session after acceptance: `agent-browser --session jev-api-docs close`.

## Bounds

- Changed DOM/refs invalidate predictions; at most two stale observations are retried.
- Repeating an action on identical page state stops the loop.
- Over 30,000 page-text characters or 500 refs hands off instead of silently truncating.
- A CLI call has a 15-second timeout; the loop timer may be exceeded by a pending command and screenshot.
- Host allowlisting and origin checks are additional controls, not full sandboxing. Freshness check and click are separate; fast races remain possible. Do not use as a production transaction executor.
- The subprocess does not poll Codex conversation interruptions. Keep bursts short and terminate it if the user cancels or redirects.
