---
"@stackra/flow-preset": patch
---

The `docs-adr-steward` and `incident-commander` agents name the docs member as `<docs>/…`, so a repository's
`stackra validate` keeps passing once its docs move from `apps/docs` to the root `docs/` (ADR 0514).
