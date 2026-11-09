---
"@stackra/repo-checks": patch
---

`catalogEncoreVersion` reads pnpm's default catalog in both spellings, the top-level `catalog:` block and `catalogs.default`, so `stackra encore:prepare` and `validate --repository` work in a repository that keeps its default catalog under `catalogs:` (as tamo does).
