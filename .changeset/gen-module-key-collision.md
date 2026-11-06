---
"@stackra/gen": patch
---

`stackra gen` refuses `module_key_collision` when a declared package's migrations need a module key that one of the
member's own modules with migrations also has, instead of resolving the need to that module and reporting a
cascade of `migration_cycle` errors. A member module that only shares a package's key stays allowed.
