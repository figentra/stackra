---
"@stackra/gen": minor
"@stackra/cli": patch
"@stackra/repo-checks": patch
"@stackra/achievements": patch
"@stackra/ai": patch
"@stackra/rules": patch
"@stackra/segments": patch
"@stackra/loyalty-kit": patch
"@stackra/webhooks": patch
"@stackra/content": patch
"@stackra/data-maintenance": patch
"@stackra/collaboration": patch
"@stackra/panel": patch
"@stackra/workflow": patch
"@stackra/access-log": patch
"@stackra/scope": patch
"@stackra/settings": patch
---

A package's entity list is a committed generated contract, `src/node/entities.gen.ts`, written by `stackra gen` and kept
fresh by `stackra gen --check` (ADR 0294 R10 and ADR 0295, amended 2026-11-01, STA-1874). Each package's `./node` now
ships its `<KEY>_ENTITIES` inlined in the build instead of importing the gitignored `.stackra/gen/entities/` at runtime,
which failed: the 0.3.0 builds of these packages carry that broken import until this release. `stackra validate`
expects the re-export from `#node/entities.gen`, and the doc standard skips `*.gen.ts` files.
