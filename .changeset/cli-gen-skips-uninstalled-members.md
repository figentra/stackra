---
"@stackra/cli": patch
---

`stackra gen` at a workspace root skips a member that a filtered install left out (no `node_modules`), by
name, instead of refusing every class it cannot resolve. The Quality Gate installs without the playground,
so `//#gen:workspace` died on 297 `kind_unregistered_base` refusals there.
