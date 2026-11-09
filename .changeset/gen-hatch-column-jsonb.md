---
"@stackra/gen": minor
---

gen now refuses a model field typed through the `@Field(zod)` hatch whose migration adds its column with any Blueprint method other than `t.jsonb(...)`. The refusal is `hatch_column_not_jsonb`; it names the model, the field and the migration, and it blocks at once rather than starting as a warning.

The ORM stores a hatch value as JSON, so a date like `"2026-11-01"` is written with its quotes. GEO's `varchar(10)` column refused every such write, in production too.

A member in that state is already broken in production, so the refusal blocks from this release on, and a bump can surface it in a member that passed gen before.

The fix in a member is either:

- a migration that changes the column to jsonb, or
- a typed field instead of the hatch.
