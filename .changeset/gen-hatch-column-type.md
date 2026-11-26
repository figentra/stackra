---
"@stackra/gen": minor
"@stackra/cli": patch
"@stackra/access-log": patch
"@stackra/panel": patch
---

The entity of a model field typed through the `@Field(zod)` hatch now takes its ORM type from the field's migration column, not always `json`. The migration owns the column type (ADR 0159), so `t.string`, `t.enum` and `t.uuid` columns are `string`, `t.integer` is `integer`, `t.bigint` is `bigint`, `t.decimal` is `double`, `t.boolean` is `boolean`, `t.timestamp` is `datetime` and `t.jsonb` stays `json`. A hatch with no column found keeps `json`.

Before, the ORM stored every hatch value JSON-encoded, so a date like `"2026-11-01"` was written with its quotes. GEO's `varchar(10)` column and any `t.enum()` column with a check constraint refused every such write, in production too. In core the same latent bug sat on `StoredView.sharing` and `StoredView.layout` (panel) and `AuditLogEntry.outcome` (access-log); their committed `src/node/entities.gen.ts` now type them `string`.

Gen prints one `info` line per hatch field whose type is taken from its column, for example `info hatch_column_type AuditLogEntry.outcome: stored as string, from t.enum() in <migration file>`. It is a notice: it never blocks and is not counted among the warnings.

`hatch_column_unmapped` is the one refusal: a hatch whose column is added with a method that has no ORM type (`t.tsvector`, `t.point`, `t.polygon`, `t.line`). It names the model, the field and the migration, and blocks at once.

A bump can change `entities.gen.ts` for such fields in a member that passed gen before (`json` becomes `string`, `integer` and so on); regenerate and commit it. A member with a hatch field on an unmapped column can also surface `hatch_column_unmapped`.
