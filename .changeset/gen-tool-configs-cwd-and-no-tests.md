---
"@stackra/gen": patch
---

The generated `.stackra/tsdown.config.ts` names each entry by absolute path and sets `cwd` to the member root, since
tsdown takes the config file's folder as cwd and did not resolve a relative entry under `.stackra/`
(`stackra build` failed with UNRESOLVED_ENTRY). The generated Vitest config passes with no tests, so a member
fresh from `stackra new` passes `stackra test`.

A package's entry barrels skip files directly in `src/`: those are hand-written entries a package.json export names (an
OS shell's `register`), and two of them re-exported from `.` collided.

The declaration build reads a generated `.stackra/tsconfig.build.json` (the member's tsconfig plus `.stackra/entry`),
so tsgo emits the entries' declarations without widening the member presets.
