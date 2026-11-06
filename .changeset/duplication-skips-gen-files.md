---
"@stackra/cli": patch
---

`stackra duplication` no longer counts committed generated files (`**/*.gen.ts`, such as `src/node/entities.gen.ts`)
in a member's source run.
