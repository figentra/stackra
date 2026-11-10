---
"@stackra/repo-checks": patch
"@stackra/cli": patch
"@stackra/gen": patch
---

A service's Encore app resolves its `#` imports, and its typecheck no longer resolves a compiled workspace package's
`#` imports into the service. Encore honours only the first `./` target of a tsconfig `paths` key, so
`stackra encore:prepare` writes, and `stackra validate --repository` expects, each package.json `imports` key with its
first target only (`pathsOfImports`). And because tsc applies `paths` to every package a service compiles, gen writes
the service's `.stackra/tsconfig.typecheck.json` (its tsconfig without `paths`), and `stackra typecheck` runs on it in a
service. After upgrading, run `stackra encore:prepare` in each service and regenerate (ADR 0091, rule 4 as corrected
2026-11-10).
