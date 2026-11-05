---
"@stackra/database": patch
---

`registerEntities` keeps one schema per schema-qualified table. A service that hosts a package's models (gen's
`#stackra/entities/hosted/…`) and also loads that package's own entity list (`registerEntities(TENANCY_ENTITIES)` in
its `node` entry) registered the table twice, and MikroORM refused to start ("Duplicate table names are not allowed").
Every test of pay's two services failed on `tenancy.approval_bindings`, and a server would not boot (STA-2116).
