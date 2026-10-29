---
"@stackra/cli": patch
---

`stackra build` in a service says there is nothing to build (Encore builds it at deploy) and exits 0, so a product's
root `pnpm build` passes.
