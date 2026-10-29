---
"@stackra/reports": patch
---

`vitest.config.ts` merges gen's `./.stackra/vitest.config` and `tsdown.config.ts` spreads gen's
`./.stackra/tsdown.config` under the package's own entries, so gen keeps both (no `shim_authored`); package.json
declares the `#stackra/*` import alias.
