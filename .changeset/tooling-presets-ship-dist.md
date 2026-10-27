---
"@stackra/commitlint-config": patch
"@stackra/tsdown-config": patch
"@stackra/vitest-config": patch
---

The vitest, tsdown and commitlint presets now ship built JavaScript with `.d.ts` types in `dist`, so a project that
installs them can load them: Node strips no types under `node_modules`. The export specifiers are unchanged
(`@stackra/vitest-config/preset`, `@stackra/tsdown-config`, …); inside this repository they still read `src` through
the `@stackra/source` condition.
