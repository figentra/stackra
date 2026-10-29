---
"@stackra/cli": patch
---

`stackra new service` declares `@stackra/app`, which the server entry gen writes imports, so a fresh service passes
`stackra gen`'s generated-dependency check. `stackra build` in a package gen wrote no entry for, with no tsdown config of
its own, says there is nothing to build and exits 0 instead of failing in tsdown.
