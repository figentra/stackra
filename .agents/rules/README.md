# `.agents/rules/`

Canonical repository rules, written once with assistant-neutral frontmatter. `tools/scripts/agents-sync.mjs`
(`pnpm agents:sync`) renders them into a marked block in the root `AGENTS.md`: `always: true` rules in full,
scoped and manual rules as an index line. Do not edit the block; edit the source here and re-run the sync.
`pnpm agents:check` fails on drift.

## Frontmatter

```yaml
---
title: <string> # required, short display name
description: <string> # required, one line; used in the index
always: true|false # load every session (default when nothing else is set)
applies_to: ["<glob>"] # root-relative globs (minimatch, dot:true); relevant when a matching file is touched
manual: true|false # never auto-attached; read only when asked for by name
---
```

Precedence: `manual` beats `always` beats `applies_to`. Write `applies_to` as an array; a `|`-joined string is
one literal pattern. A pattern without a leading `**/` is anchored at the repo root.

## Writing a rule

- Short and checkable. Each rule ends with an **Enforcement** line naming the existing check, or "planned".
- Rules state repository facts and link to the docs page that owns the reasoning (`apps/docs/src/docs/...`).
- Decide `always` honestly. A rule that matters only when touching `package.json` says so.
