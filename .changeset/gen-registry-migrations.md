---
"@stackra/gen": patch
---

`stackra gen` now compiles the migrations of packages installed from the registry. They ship as TypeScript source under
`node_modules`, where Node refuses to strip types, so gen failed with `migration_load_failed` in every product service
that depends on a package with migrations. `loadSourceModule` strips such a file into `.stackra/cache/sources/` and loads
that copy, which resolves `@stackra/database` from the member root.
