---
"@stackra/gen": patch
---

`@stackra/gen/node` exports `checkMigrationDrift(root)`: it compiles a service's migrations, replays them through the
member's own `@stackra/database/node`, builds the schema its models declare and returns their differences. The `.`
entry exports the pure parts: `expectedSchema` (tables, columns, nullability, `@Index` indexes under their `idx_`
names, `fk_` foreign keys), the field-to-Postgres type map `postgresTypeOf` with `postgresTypeAgrees`, `diffSchemas`
and `formatSchemaDifference`. A class facet now records its constant arguments after the first as `rest`, so
`@Index(["a"], { unique: true })` keeps its `unique` and `where`.
