---
"@stackra/gen": patch
---

A package or service with an `.int.test.ts` under `src/` also gets `.stackra/vitest.int.config.ts`, the generated unit
config narrowed to the integration tier with `intTier`, which `stackra test --tier int` runs; no member authors a
`vitest.int.config.ts`.
