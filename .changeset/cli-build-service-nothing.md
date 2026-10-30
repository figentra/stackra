---
"@stackra/cli": patch
---

`stackra build` in a service says there is nothing to build (Encore builds it at deploy) and exits 0, so a product's
root `pnpm build` passes.

`stackra build` in a package runs plain `tsdown` from the member root, which loads the generated config through the root
shim gen writes, instead of `tsdown --config .stackra/tsdown.config.ts`.
