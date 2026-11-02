---
"@stackra/gen": patch
---

A `?:` field whose `@Field(zod)` hatch already ends in `.optional()` compiles to `.exactOptional()` instead of
`.optional().exactOptional()`. The latter's output admits `undefined`, which `?:` under `exactOptionalPropertyTypes`
does not, so the schema's `$Check` failed with TS2344 in every consumer that wrote such a hatch (STA-2022).
