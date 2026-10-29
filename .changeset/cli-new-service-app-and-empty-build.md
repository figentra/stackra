---
"@stackra/cli": patch
---

`stackra new service` declares `@stackra/app` and `@stackra/container`, which the server entry and the Encore app gen
writes import, so a fresh service passes
`stackra gen`'s generated-dependency check. `stackra build` in a package gen wrote no entry for, with no tsdown config of
its own, says there is nothing to build and exits 0 instead of failing in tsdown.
