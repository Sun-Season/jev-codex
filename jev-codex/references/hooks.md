# Native compact lifecycle integration

This optional integration runs around real Codex compaction. It does not replace Codex's summarizer and does not promise faster or cheaper compaction. Hook definitions require explicit review/trust in Codex (`/hooks` in CLI). Installing the skill alone does not enable hooks.

## Three synchronous hooks

All three call the same `scripts/compact-hook.mjs` command. Use an absolute Node executable and installed script path. Configure `features.hooks = true` in the applicable config.toml. Merge definitions with existing hooks; do not overwrite unrelated configuration.

```json
{
  "hooks": {
    "PreCompact": [{"matcher":"manual|auto","hooks":[{"type":"command","command":"/absolute/node /absolute/jev-codex/scripts/compact-hook.mjs","timeout":15,"statusMessage":"Jev: preserve compact notes"}]}],
    "PostCompact": [{"matcher":"manual|auto","hooks":[{"type":"command","command":"/absolute/node /absolute/jev-codex/scripts/compact-hook.mjs","timeout":5,"statusMessage":"Jev: confirm native compact"}]}],
    "SessionStart": [{"matcher":"^compact$","hooks":[{"type":"command","command":"/absolute/node /absolute/jev-codex/scripts/compact-hook.mjs","timeout":5,"additionalContextLimit":7000,"statusMessage":"Jev: restore compact notes"}]}]
  }
}
```

Place in a trusted project `.codex/hooks.json` or user `~/.codex/hooks.json`. Also create PRIVATE `hook-config.json` in the skill folder:

```json
{
  "enabled":true,
  "allowedCwds":["/absolute/project"],
  "transcriptRoots":["/absolute/codex-home/sessions"],
  "dataDir":"/absolute/private/jev-compact-state"
}
```

Exact cwd matching deliberately limits external API transmission to explicitly configured projects. Transcript roots restrict file reads; configure the actual sessions root. Reuse local-config.json/env-file credential configuration. Do not put a key in hook-config.json. Both local files and runtime state must stay out of published packages. Review the exact three hook definitions with `/hooks`, trust them, then resume/reload the intended task if needed. Do not edit trust hashes or bypass hook trust.

## Runtime behavior

PreCompact reads at most the final 1 MiB of the transcript; transcript format is not a stable API. It extracts only supported user messages and final assistant prose, at most 40 messages/30,000 characters, clips an individual message at 3,000 characters with an explicit marker, and redacts credential patterns plus the configured key before transmission. It excludes developer/system instructions, reasoning and raw tool data. Pattern redaction cannot guarantee discovery of every kind of secret; opt in only for appropriate project data.

One Jev request chooses keep/omit. Recent user intent is retained; low-confidence decisions keep. At most 4,800 JSON characters of excerpts are selected from newest backward. Older or oversized material can be absent; notes are explicitly incomplete and the original transcript remains available. This is bounded extractive memory, not a full generated summary or a guarantee against forgetting. It cannot recover details already lost in previous compactions.

PostCompact confirms the prepared generation only for the matching turn. SessionStart(source=compact) returns confirmed notes as additionalContext before continuation, once per generation. Notes retain original roles and are labeled historical evidence, never new instructions/authorization. State binds session, cwd and transcript, expires after ten minutes, and uses private files/atomic replacement. A new attempt invalidates old notes; wrong-turn, stale or unconfirmed state is not restored. A short-lived lock prevents simultaneous updates; a lock abandoned over two minutes ago can be recovered.

API failure falls back to bounded recent excerpts. Errors never return continue:false; native compaction continues. Restored notes add context after compaction, so this primarily improves continuity, not token savings. Stop by setting hook-config.json enabled:false or disabling the three hooks in `/hooks`.

## Verify honestly

Offline tests simulate events; live Jev smoke tests still do not prove native integration. A complete test requires trusted hooks, an isolated test conversation, actual `thread/compact/start` or `/compact`, native contextCompaction completion, matching hook notifications/state and proof the next model request receives JEV_COMPACT_RESTORE. Do not test by rewriting rollout/history files or bypassing trust. If trust is pending, report native verification as pending.

Official references: https://learn.chatgpt.com/docs/hooks and https://learn.chatgpt.com/docs/app-server
