# Implementation Plan: an end-to-end example service (sign-in, tenancy, several surfaces, events and jobs)

**Spec**: `.agents/specs/sta-2856-example-service/spec.md` · **Linear**: STA-2856 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2856-example-service/spec.md`

## Summary

`services/example` becomes a programming-model v3 member with two modules. `notes` is the X11 resource (PR #1064's two
example commits, carried onto `main`): a tenant-owned note with create, get, list, update and delete through the
pipeline, permissions, validation, idempotency and integration events. `activity` is new: a tenant-owned
`ActivityEntry`, three listeners on the notes events, a feed query (HTTP and MCP tool) and a per-tenant daily retention
job through the queue. Gen binds `SchedulerService` for a service that declares the scheduler, and defaults
`CronScopes` to tenancy's driver for one that also declares tenancy, so the generated CronJobs can fire in every tenant.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `services/example` (`@figentra/service-example`, private), `packages/developer/gen` (`@stackra/gen`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); unit on PGlite and the memory drivers; `.int` on Postgres
  (Testcontainers) as the NOBYPASSRLS role
- **Storage**: Postgres schemas `notes` and `activity`, compiled from the migrations by gen
- **Runtime target**: node (the generated Encore app)

## Constitution Check

| Law                                   | Result | Note                                                                                     |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the service imports packages only; `activity` imports only notes' public `events/` group |
| Secrets (ADR 0009)                    | PASS   | none; issuer, audience and the Encore app id are configuration                           |
| Security                              | PASS   | every route needs a signed-in caller; the job has no route or tool                       |
| HTTP and events                       | PASS   | derived routes, cursor pages, typed refusals; events carry ids only                      |
| Tenancy                               | PASS   | `BelongsToTenant` and `t.belongsToTenant()`; isolation tests on Postgres as NOBYPASSRLS  |
| Delegation                            | PASS   | one session, one branch                                                                  |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                                   |
| Test placement (ADR 0022)             | PASS   | every test in `__tests__/` beside its subject                                            |
| Versions and catalogs                 | PASS   | `workspace:*` and `catalog:` only                                                        |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                                        |
| Licence tier (ADR 0077)               | PASS   | free                                                                                     |
| Docs and ADRs                         | PASS   | READMEs, AGENTS.md, ADR 0075 note, gen changeset                                         |

## Deploy modes

| Mode       | Behaviour                                                                   |
| ---------- | --------------------------------------------------------------------------- |
| SaaS       | Encore CronJobs fire the retention cron; tenancy's driver lists the tenants |
| On-prem    | `SchedulerService.run` is the timer; the same bindings and driver default   |
| Air-gapped | same as on-prem                                                             |

## Correctness properties

- **P-001** (Validates: FR-002): for every notes event a committed call published, the feed gains exactly one entry of
  that kind for that note in the call's tenant.
- **P-002** (Validates: FR-004): for every tenant and cutoff, a retention run deletes exactly the tenant's entries that
  happened before the cutoff.
- **P-003** (Validates: FR-005): for every service IR, the wiring binds `SchedulerService` iff the service declares
  `@stackra/scheduler`.
- **P-004** (Validates: FR-006): for every service IR, `CronScopes` defaults to `tenancy` iff the service declares the
  scheduler and tenancy.
- **P-005** (Validates: FR-008): for every table read with an input cursor that does not decode, the read refuses
  `table_cursor_invalid`; any other failure is rethrown unchanged.
- **P-006** (Validates: FR-001): for every note operation, a caller of one tenant never reads, changes or deletes another
  tenant's note (`not_found`), and every committed write records exactly one event carrying ids only.
- **P-007** (Validates: FR-003): for every feed read, each entry belongs to the caller's tenant, entries come newest
  first, and following `nextCursor` visits every entry once.
- **P-008** (Validates: FR-007): for every token, the caller is its user in its tenant iff its signature, issuer,
  audience and expiry verify; otherwise the call is the one `unauthenticated` refusal.

## Architecture overview

A note write runs in the pipeline's tenant transaction and records its event on the model; the outbox writes it with
the row. The relay hands the committed event to the service's inbox, which runs the activity listener as the call's
actor in its tenant; the listener inserts the entry, which takes the running tenant. The scheduler's tick (an Encore
CronJob in SaaS) asks `CronScopes` for the tenants and pushes one prune job per tenant; the queue worker runs each
through the pipeline in that tenant's isolation.

## Components and responsibilities

- `notes` module: model, migration, factory, permissions, five operations, schemas, refusal, events, view function.
- `ActivityEntry` (`activity/models`), `CreateActivityEntriesMigration` (`activity/database/migrations`): the table.
- `ActivityEntryService`: `record` and `prune`, no tenant argument.
- `RecordNote{Created,Updated,Deleted}Listener`: one entry per event, at the event's time, audited by id.
- `ListActivityQuery`: the feed, cursor pages; `ActivityEntryView` and `activityEntryViewOf`.
- `PruneActivityAction`: the system job with `job.cron` per tenant.
- Gen: a `BOOT_SERVICES` row for `@stackra/scheduler`; a `SYSTEM_PORTS` row for `CronScopes`.
- `CrudService.table` (`@stackra/database`): maps a `CursorError` for an input cursor to `TableCursorInvalidError`.

## Files and folders

```text
services/example/
  README.md
  AGENTS.md
  package.json
  runway.yaml
  tsconfig.json
  tsdown.config.ts (removed: gen writes the build config)
  stackra.config.ts
  stackra.manifest.json
  openapi.json
  assets/.gitkeep
  src/main.ts (removed: gen writes the entries)
  src/example.module.ts (removed: a v3 member has no root module)
  src/modules/notes/
  src/modules/activity/
services/README.md
packages/developer/gen/
  README.md
  src/core/constants/boot-services.constant.ts
  src/core/functions/system-driver-defaults.function.ts
packages/data/database/
  README.md
  stackra.manifest.json
  src/core/index.ts
  src/core/bases/crud-service.base.ts
  src/core/errors/table-cursor-invalid.error.ts
apps/docs/src/docs/adr/0075-stackra-ships-packages-figentra-os-ships-services.mdx
runway.yaml
knip.jsonc
.changeset/gen-binds-the-scheduler-and-tenant-cron-scopes.md
.changeset/table-refuses-an-invalid-cursor.md
```

`notes/` holds access, actions, database (migration and factory), errors, events, functions, models, queries, schemas,
services and `__tests__`; `activity/` holds access, actions, database/migrations, enums, functions, listeners, models,
queries, schemas, services and `__tests__`. Tests sit in `__tests__/` beside their subject.

## Data models and migrations

- `notes.notes`: public id `not_`, `tenant_id` with a forced equality policy, timestamps, `title` (120), `body` (2000),
  index on `(tenant_id, created_at)`.
- `activity.activity_entries`: public id `act_`, `tenant_id` with a forced equality policy, timestamps, `kind` (40),
  `note_id` (30), `occurred_at`, index on `(tenant_id, occurred_at)`.

## Contracts

- Routes: `POST/GET /app/notes`, `GET/PATCH/DELETE /app/notes/:noteId`, `GET /app/activity-entries`; MCP tools for each
  operation whose actors include a user or an agent.
- Events: `notes.note.created.v1`, `notes.note.updated.v1`, `notes.note.deleted.v1` (ids only).
- Job: `activity.activity_entry.prune@1`, cron `30 3 * * *`, `perScope`, input `{ keepDays: 90 }`.
- Gen: wiring row `SchedulerService` (scheduler declared); `CronScopes` `default: "tenancy"` (scheduler and tenancy).

## Error handling

Typed refusals only (`empty_note_update`, `not_found`, validation, `unauthenticated`). A failing listener is recorded on
its delivery and never fails the call; a failing job attempt is retried with back-off and dead-lettered after the last.

## Security and tenancy

The tenant comes from the verified token through the pipeline, never from input. Both tables force their row policy;
isolation is proved on Postgres as the NOBYPASSRLS role. Events and feed entries carry ids only.

## Testing strategy

- AC-001, AC-002, AC-003: `activity/__tests__/activity-feed.test.ts` on the generated wiring.
- AC-004, EC-02, EC-03: `activity/__tests__/activity-isolation.int.test.ts`; notes in `note-isolation.int.test.ts`.
- AC-005: `notes/__tests__/sign-in.test.ts`.
- AC-006: `emit-wiring.function.test.ts`, `system-driver-defaults.function.test.ts`.
- AC-007 (P-005): `crud-service.base.test.ts` ("refuses a cursor no page gave") and the forged cursor in
  `activity-feed.test.ts`.
- Unit tests per listener, the query, the job, the view; manifest tests pin each surface.
- Revert checks: the gen rows, a listener and the prune cutoff each fail their tests when reverted.

## Rollout

A patch changeset for `@stackra/gen` and a minor one for `@stackra/database` (a new export). The example is private. Services that declare the scheduler gain the binding on
their next `stackra gen`.

## Delegation and risk plan

One session, one branch. Budget: one PR. Follow-up: STA-2657 (deployed-boot selectors), STA-2828 (health).

## ADRs

ADR 0075 (note), 0078, 0098, 0148, 0206, 0209, 0239, 0263, 0269, 0294, 0305: all Accepted.

## Docs

`services/example/README.md`, `services/example/AGENTS.md`, `services/README.md`, `packages/developer/gen/README.md`,
ADR 0075, `.changeset/gen-binds-the-scheduler-and-tenant-cron-scopes.md`.

## Complexity tracking

none
