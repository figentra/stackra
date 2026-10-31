---
"@stackra/tsdown-config": patch
---

`library()` returns `LibraryConfig`, exported by this package, so a member's `export default library(...)` typechecks
under `declaration: true` without `tsdown` among its own dependencies (TS2883, STA-1743).
