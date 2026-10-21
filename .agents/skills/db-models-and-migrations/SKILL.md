---
name: db-models-and-migrations
description: Model and migrate data in Stackra - @Model classes with field decorators, classification and traits, the EntitySchema gen emits for MikroORM, @stackra/database as the only ORM importer, gen-ordered SQL migrations with expand-and-contract and timeouts, the raw SQL rule and approved extensions, row-level security as equality on tenant_id, one logical database per service, factories and seeds. Use when adding or changing a model, field, index, migration, RLS policy or seed.
---

# Models and migrations

MikroORM is the one ORM, it runs only on the server, and only `@stackra/database` imports `@mikro-orm/*` (ADR 0014,
0097). You write decorated model classes; `stackra gen` emits the MikroORM `EntitySchema` and orders the SQL migrations.
Shapes follow the ADRs; `@stackra/model` and `@stackra/database` docs win once they ship.

## Worked example: an invoice

```ts
// src/modules/invoices/models/invoice.model.ts
import { Model, Field, BelongsTo, HasMany, Classified, UsesStateMachine } from "@stackra/model";

@Model({ key: "billing.invoice", table: "invoices", publicIdPrefix: "inv", tenantOwned: true,
         traits: ["HasTimestamps", "Auditable"], delete: "archive" })
export class Invoice {
  @Field.string({ max: 32 }) number!: string;
  @Field.integer({ min: 0 }) totalMinor!: number;            // money in integer minor units
  @Field.string({ length: 3 }) currency!: string;
  @UsesStateMachine(InvoiceFlow) status!: InvoiceStatus;     // never written directly (ADR 0161)
  @Classified("personal") @Field.string({ max: 200 }) billingName!: string; // classification (ADR 0134)
  @BelongsTo(() => Customer) customer!: Customer;
  @HasMany(() => InvoiceLine) lines!: InvoiceLine[];
}
```

- Every model has a stable `key` and rename-safe fields (ADR 0133); every field carries a classification before it stores
  personal data (ADR 0134); delete policy is `archive`, `soft` or `hard`.
- Public ids are `<prefix>_<26>` over a UUIDv7 (ADR 0135); the database id never leaves the service.
- Tables snake_case plural, `idx_` and `fk_` names (ADR 0231).
- Lists: filters, sorts and includes are declared on the model and accepted by list actions; cursor pagination is the
  default; eager loading or the DataLoader, never N+1.
- Validation lives in the field decorators, compiled to one Zod schema (ADR 0095).

## Tenancy (ADR 0239, `.agents/rules/tenancy.md`)

A tenant-owned table has `tenant_id`, row-level security **enabled and forced**, and one **equality** policy on
`tenant_id`. No tree logic in a policy; organisation and parent views come from read models built by audited jobs
(ADR 0163, 0239). The application layer scopes too: two layers, always. An isolation test proves tenant B sees nothing
of tenant A and an unscoped query returns zero rows.

## Migrations (ADR 0159)

Gen writes ordered SQL files, including migrations shipped in packages, into the host's stream; Encore's runner applies
them in SaaS, a pre-upgrade job on-prem.

1. **Expand and contract.** Add the new column, backfill, switch reads, and only in a later release drop the old one.
2. **Timeouts** on every migration: lock and statement.
3. **Concurrent index builds** in their own migration.
4. **Backfills** run as queue jobs, never inside the migration.
5. **Forward fix only.** Data is never rolled back by a migration.
6. The squawk lint runs in CI.

```sql
-- 0003_invoice_add_due_at.sql (expand)
SET lock_timeout = '3s'; SET statement_timeout = '30s';
ALTER TABLE invoices ADD COLUMN due_at timestamptz;
-- 0004_invoice_due_at_index.sql (its own migration)
CREATE INDEX CONCURRENTLY idx_invoices_tenant_id_due_at ON invoices (tenant_id, due_at);
```

## Raw SQL (ADR 0160)

Only in a module service method of `@stackra/database`, parameterised, typed with Zod, under the RLS session, with a
`// raw-sql:` comment giving the reason. Actions contain no SQL. Approved extensions: pgvector, pg_trgm, ltree, citext,
pgcrypto; PostGIS is not approved.

## Databases (ADR 0238)

One Postgres server per environment; one logical database and one role per service, in every topology. No service reads
another service's tables; use its client or its events (ADR 0014, 0142).

## Seeds and factories (ADR 0190)

Factories with states for tests; seed profiles `minimal`, `demo` (the golden tenant) and `test`; synthetic data only.

## Never

- Another ORM or query builder, or MikroORM decorators in a model.
- A migration that drops or rewrites data in the same release that stops using it.
- An ORM on a client (client data is `@stackra/storage`, ADR 0256).
- A policy that walks the tenant tree.

## Check

`pnpm --filter <member> test` (with the `.int` tier against Testcontainers), `stackra gen --check` once gen ships, then
`pnpm verify`. Review: `security-tenancy-reviewer` for any tenant-owned table, RLS policy or personal-data field.
