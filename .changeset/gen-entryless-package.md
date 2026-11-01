---
"@stackra/gen": patch
---

A package with nothing to export yet gets an empty `.` entry (`export {};`), so its build makes an empty
`dist/index.mjs` instead of tsdown falling back to `src/index.ts` and failing (STA-1753).
