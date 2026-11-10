---
"@stackra/repo-checks": patch
"@stackra/cli": patch
---

The `encore.dev` version a service pins can live in the root package.json as `stackra.encore`, so a repository whose
services pin the literal keeps no unused catalog entry for it. `encoreReferenceVersion` (exported from
`@stackra/repo-checks/node`) reads `stackra.encore` first and falls back to the default catalog's `encore.dev`; the
service check and `stackra encore:prepare` use it. A repository that keeps the version in its catalog needs no change.
