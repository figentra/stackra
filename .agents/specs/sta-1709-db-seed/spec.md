# Feature Specification: `stackra db seed`

**Feature Branch**: `figentra/sta-1709-db-seed`

**Created**: 2026-10-31

**Status**: Draft

**Linear**: STA-1709

**Clarifications status**: pending (Q1 to Q4 below carry a proposed answer each; the leader confirms or changes them)

**Input**: Leader: "Take `stackra db seed`: profiles, one transaction per seeder, seeders resolved through the booted
container (reusing STA-1698), idempotent re-runs, and running through the CallIsolation context once AI everywhere's
tenancy fix lands, so tenant seeds set app.tenant_id correctly. Check how the testbed's `stackra seed-pack <product>
--profile test` (STA-1675 design) and runway expect to call it, and align with them."

## What exists today

- `Seeder` (`@stackra/database`): `run()` writes one profile (`minimal`, `demo`, `test`, the file name) of one module;
  identity `<module>.<profile>`; a seeder may inject services. Its docblock says `stackra db seed` runs it; no such
  command exists. Only the testing module's `.seed(...)` runs seeders (resolved through the container since STA-1698).
- `stackra db migrate` and `db rollback` (cli → the member's own `@stackra/database/node`, raw SQL over
  `directDatabaseUrl()`, no container).
- `stackra seed-pack <product> --profile <p> --env <e>`: writes a product's seed-pack records (data, not code) to the
  seed ledger (`seed_records`, migration 0003); never a tenant-changed row. No container.
- Runway's `previewSeedStep` and the testbed's console plan (`testbed-spot-console-isolation`, STA-1675) call only
  `stackra seed-pack <product> --profile <p> --env preview|test`. Neither runs a `Seeder` class today.
- `CallIsolation` is not on main (AI everywhere's tenancy fix).

## Impact _(mandatory)_

- **Apps touched**: none
- **Services touched**: none in this change (every service with seeders gains the command)
- **Packages touched**: @stackra/database (the seed runner), @stackra/gen (the seeders list and the seed entry),
  @stackra/cli (the command), @stackra/runway (the preview seed step, Q4)
- **Cross-service events**: none; a seeder's own writes go through its services, so their outbox events are written
  as any write's are
- **Tenancy and data**: writes seed rows; tenant-owned rows only inside a tenant's isolation context (Q3)
- **Secrets**: none read by the command; the connection is `directDatabaseUrl()` as for `db migrate`
- **ADR needed**: no; ADR 0190 (profiles) and ADR 0325 decision 7 (seeds resumable and tested) cover it
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: the cli README (commands), the database README (seeders), the seeding guide
- **Lane**: full
- **Change risk**: R2

## User Scenarios & Testing

### Story 1: seed a service locally (P1)

A developer runs `stackra db seed --profile demo` in a service folder after `stackra db migrate`. Every module's
`minimal` seeder runs, then every module's `demo` seeder, each in its own transaction, each built by the service's
container so the services it injects are there.

**Acceptance**: a seeder that injects a service (OS identity's `SessionsMinimalSeeder` takes `SettingsPackService`)
runs; a failing seeder rolls back alone, the command stops there, names it and exits non-zero; the seeders before it
stay applied.

### Story 2: re-run (P1)

Running the same command again does not duplicate rows: a seeder already applied with the same source is skipped; a
seeder whose source changed runs again (Q2).

### Story 3: preview and testbed (P1)

Runway's preview deploy and the testbed's console job seed a product with one call per profile and get both the
seed-pack records and every seeder of that profile (Q4).

### Story 4: tenant rows (P2, after CallIsolation lands)

A seeder that writes tenant-owned rows runs inside the tenant's isolation context, so `app.tenant_id` is set and RLS
holds (Q3).

### Edge cases

- A member with no seeders: `db seed` reports none and exits 0.
- An unknown `--profile`: usage error listing `minimal|demo|test`.
- A package member: its seeders run only through the service that hosts it (the host's list includes them).
- `--module <key>`: only that module's seeders.

## Requirements

- **FR-1** `stackra db seed [--profile minimal|demo|test] [--env <environment>] [--module <key>]`, default profile
  `minimal`; `demo` and `test` run `minimal` first (ADR 0190; runway's "loaded after `minimal`").
- **FR-2** Gen lists the member's seeders (own and hosted packages', from their manifests) in module order with their
  key, profile and a checksum of the seeder file, and emits a seed entry that boots the member's container (wiring,
  registrations, database connected over `directDatabaseUrl()`, no HTTP, no relay loop) and hands it to the runner.
- **FR-3** The runner (`@stackra/database/node`) resolves each seeder through the container (`app.has ? get : construct`,
  the STA-1698 rule), runs it in one transaction, and records `<module>.<profile>` with its checksum in the seed ledger.
- **FR-4** Re-runs follow Q2.
- **FR-5** Tenancy follows Q3.
- **FR-6** Runway and the testbed follow Q4.

## Questions (proposed answers; the leader confirms)

- **Q1. Where the seed entry runs.** Proposed: gen writes `.stackra/entry/seed.ts`; `stackra db seed` runs it in the
  member folder with the member's own TypeScript runner (the one `stackra dev` uses), as `db migrate` runs the member's
  own `@stackra/database/node`. The CLI holds no container and no driver.
- **Q2. Idempotent re-runs.** Proposed: the ledger keeps each applied seeder key with its file checksum, like
  `schema_migrations_history`; an unchanged seeder is skipped, a changed one runs again, so a seeder must upsert by its
  `static ids` (the convention already says a seeder's public ids are declared once there). `--again` re-runs all.
- **Q3. Tenancy.** Proposed: a `minimal` seeder writes platform rows and runs with no tenant; a seeder that declares
  tenant rows runs once per tenant inside `CallIsolation` when it lands. Until then a tenant-owned write is refused
  (RLS fails closed), which this change tests. Which tenants a `demo`/`test` profile seeds comes from the seed pack.
- **Q4. Alignment with runway and the testbed.** Proposed: `stackra seed-pack <product> --profile <p> --env <e>` stays
  the one call; after writing the records it runs `db seed --profile <p> --env <e>` in each of the product's service
  members, so `previewSeedStep` and the testbed's console job change nothing. Alternative: both add a second
  `stackra db seed` step.

## Success criteria

- A test boots a fixture service's generated seed entry with a seeder that injects a service and seeds it through
  `db seed` and through `.seed()`.
- A second `db seed` writes nothing; a changed seeder runs again.
- A failing seeder rolls back alone and exits non-zero.

## Status history

- 2026-10-31: Draft, questions sent to the leader
