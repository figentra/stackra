---
"@stackra/typescript-config": patch
"@stackra/oxlint-config": patch
"@stackra/tsdown-config": patch
"@stackra/vitest-config": patch
---

Preset sources move into each package's `src/`. The public export specifiers are unchanged
(`@stackra/typescript-config/node`, `@stackra/vitest-config/coverage`, …). An oxlint consumer that extends a preset by
file path now points at `@stackra/oxlint-config/src/<preset>.jsonc`.
