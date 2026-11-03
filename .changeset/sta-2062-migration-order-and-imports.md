---
"@stackra/gen": patch
---

Migrations apply after the modules they depend on and after the owner of each macro they call (ai after tenancy); a migration that imports anything but `@stackra/database` or `#stackra/migrations` is refused (`migration_import_forbidden`); a service's own macros are merged into `Blueprint` through the generated `.stackra/gen/blueprint.ts`.
