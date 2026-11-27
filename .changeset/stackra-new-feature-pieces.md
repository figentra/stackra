---
"@stackra/cli": minor
---

`stackra new` adds the pieces of a feature inside a service: `module <key>` (a module with its first model), `model <name> --module <key> [--fields title:string,notes:text?]` (the model with a free public id prefix, its create migration and a PGlite test, its `CrudService`, view schema and Permissions class), `migration <add-...> --module <key> --fields ...` (the next migration adding nullable columns, with the same fields on the model), `action <verb>-<model>` and `query <verb>-<model>` (with their schemas, a unit test, and the action's permission added at L2). In a service that runs `@stackra/tenancy` a new model is tenant-owned, or global with `--global`. Each kind declares the packages its files and gen's wiring import, formats what it wrote with the workspace's oxfmt, refuses before writing anything when a file exists, and takes `--dry-run`; the output passes `stackra gen` strict (STA-2855).
