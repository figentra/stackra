---
"@stackra/flow-preset": patch
---

The docs-changesets-steward agent verifies with `pnpm changeset:check`, the check `pnpm verify` and the Quality Gate now run: every changed published member must be named by a changeset, or an empty changeset must say why no release is needed. It no longer claims `changeset status --since=origin/main` is what CI runs.
