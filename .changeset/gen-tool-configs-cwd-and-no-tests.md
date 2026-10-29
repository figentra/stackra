---
"@stackra/gen": patch
---

A package gets a gitignored root `tsdown.config.ts` shim re-exporting the generated config, so plain `tsdown` runs from
the member root, where `.stackra/entry/*` resolves (with `--config .stackra/…` tsdown took `.stackra/` as its cwd). The
generated Vitest config passes with no tests only for a member with no source (fresh from `stackra new`); a member with
source and no tests still fails.

A package's entry barrels skip files directly in `src/`: those are hand-written entries a package.json export names (an
OS shell's `register`), and two of them re-exported from `.` collided.
