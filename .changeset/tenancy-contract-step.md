---
"@stackra/achievements": minor
"@stackra/rules": minor
"@stackra/segments": minor
"@stackra/content": minor
"@stackra/collaboration": minor
"@stackra/workflow": minor
"@stackra/tenancy": minor
---

The tenancy contract step. A new migration in each package (`achievements.0004`, `rules.0005`, `segments.0003`,
`content.0006`, `collaboration.0004`, `workflow.0011`) makes `tenant_id` NOT NULL on the tables the expand step gave
it, makes the tenant equality `pol_<table>_tenant_id` each table's one permissive policy, and keeps the scope path only
as a restrictive policy, which narrows a session inside its tenant and never widens it. The models of those tables now
carry `BelongsToTenant`, so a row is filled from the running tenant call.

Each migration first counts the rows with no tenant. If any table has one, it refuses before changing anything and
names each table's count. An environment that wrote rows in the expand step outside a tenant call runs the tenant
backfill (RUNWAY 4c) first, then migrates again. After this step, these tables are written only inside a tenant call.

`t.belongsToTenant({ contract: true })` is the macro's form for that step: `SET NOT NULL` on the existing column and
the equality policy. The packages ship an int test tier (`test:int`) for these migrations.
