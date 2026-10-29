---
"@stackra/gen": patch
---

The generated `.stackra/tsdown.config.ts` sets `cwd` to the member root, since tsdown takes the config file's folder
as cwd and `stackra build` failed with UNRESOLVED_ENTRY. The generated Vitest config passes with no tests, so a member
fresh from `stackra new` passes `stackra test`.
