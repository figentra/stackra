---
"@stackra/achievements": patch
"@stackra/rules": patch
"@stackra/segments": patch
"@stackra/content": patch
"@stackra/search": patch
"@stackra/collaboration": patch
"@stackra/workflow": patch
---

The expand step of tenancy audit gap D: each scope-path table gains a nullable, indexed `tenant_id` that every insert
fills from `app.tenant_id` (`t.belongsToTenant({ expand: true })`), with no policy change, so no session reads a row
more or less. Migrations: `achievements.0003_add_tenancy` (`award_kinds`, `awards`), `rules.0004_add_tenancy`
(`rule_sets`), `segments.0002_add_tenancy` (`segments`, `segment_memberships`), `content.0005_add_tenancy`
(`custom_fields`, `custom_field_value_sets`, `revisions`), `search.0008_add_tenancy` (`vector_items`, `queries`),
`collaboration.0003_add_tenancy` (the four comment tables) and `workflow.0010_add_tenancy` (`automations`, `checklists`,
`checklist_progresses`). Each package now depends on `@stackra/tenancy` for the macro. Older rows stay null until a
backfill job sets them; the contract step (NOT NULL, the tenant equality as the one permissive policy, the scope path
restrictive) follows in a later release.
