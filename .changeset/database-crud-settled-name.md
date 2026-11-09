---
"@stackra/database": patch
---

`CrudService` no longer declares a private `settled` member (0.26.0), which broke any subclass with a member of that name (TS2415 and a runtime override). The read flush is a module function now.
