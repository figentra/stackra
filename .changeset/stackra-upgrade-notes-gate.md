---
"@stackra/cli": minor
---

`stackra upgrade` knows every release from 0.4.0 to 0.33.1 that asks a consumer to act (STA-145): 36 entries, oldest
first. New codemods rename runway's `runCommand` to `runProgram` (0.10.0) and move `boundIsolation`,
`ClaimNotLoadedError` and `RowIsolationMissingError` from `@stackra/outbox` to `@stackra/actions` (0.30.0); new reports
list each custom outbox, workflow journal, queue and schedule driver still on the old port shape (0.27.0, 0.29.0,
0.30.0); 0.33.1 runs `stackra encore:prepare` in every service; the rest are notes with their steps. New
`stackra upgrade-notes`, run by `pnpm validate`: it fails when a pending `@stackra/*` changeset or a released
`@stackra/*` changelog entry carries a break mark and has no entry, so the entries stay complete. A changeset names its
entry on a line `Upgrade entry: <id>`. After a failed command, `stackra upgrade` names the re-run
(`--from <old> --to <new> --allow-dirty`), which installs again and runs every step; a rename codemod renames a named
import and a namespace use of one export in one file without aliasing the import.
