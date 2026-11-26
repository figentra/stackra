---
"@stackra/flow-preset": patch
---

The docs-changesets-steward agent verifies with `pnpm changeset:check`, the check `pnpm verify` and the Quality Gate now run: every changed published member must be named by a changeset, named with `none` when it needs no release; an empty changeset that says why waives a change only when no other changeset names a package. A catalog bump counts for each published member that ships the entry. It no longer claims `changeset status --since=origin/main` is what CI runs.
