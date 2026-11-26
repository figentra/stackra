# @figentra/service-example

The reference example service: the pieces of a real feature working together, the way a Stackra service is written,
so a team can copy a proven pattern for each task. It is a test bed for the packages and the generator, not a product
feature ([ADR 0075](../../apps/docs/src/docs/adr/0075-stackra-ships-packages-figentra-os-ships-services.mdx)). Plain
TypeScript, no Encore file here (ADR 0124): `stackra gen` writes the wiring, the entries and the Encore app into
`.stackra/` and `stackra-encore/`, and nobody writes `main.ts`. See [`services/`](../README.md) for the rules.

Two feature modules:

- **notes**: a tenant's users write notes. One tenant-owned resource from the model to the routes, with permissions,
  validation, idempotency and integration events.
- **activity**: a tenant's activity feed. Its listeners turn the notes events into feed entries after each call
  commits, users and agents read the feed, and a daily job deletes entries past their retention, once per tenant,
  through the queue.

## Operations

| Operation     | Key                                | Surfaces                                   | Permission                      | Risk | Notes                                              |
| ------------- | ---------------------------------- | ------------------------------------------ | ------------------------------- | ---- | -------------------------------------------------- |
| Create note   | `notes.note.create@1`              | `POST /app/notes`, MCP tool                | `notes.note.create`             | L2   | `Idempotency-Key` required; records `note.created` |
| Get note      | `notes.note.get@1`                 | `GET /app/notes/:noteId`, MCP tool         | `notes.note.read`               | L0   | another tenant's note is `not_found`               |
| List notes    | `notes.note.list@1`                | `GET /app/notes`, MCP tool                 | `notes.note.read`               | L0   | newest first, cursor pages                         |
| Update note   | `notes.note.update@1`              | `PATCH /app/notes/:noteId`, MCP tool       | `notes.note.update`             | L2   | a field left out is kept; records `note.updated`   |
| Delete note   | `notes.note.delete@1`              | `DELETE /app/notes/:noteId`, MCP tool      | `notes.note.delete`             | L2   | irreversible; records `note.deleted`               |
| Read the feed | `activity.activity_entry.list@1`   | `GET /app/activity-entries`, MCP tool      | `activity.activity_entry.read`  | L0   | newest first, cursor pages                         |
| Prune feed    | `activity.activity_entry.prune@1`  | cron `30 3 * * *` per tenant, queue worker | `activity.activity_entry.prune` | L2   | system only: no route, no tool; irreversible       |

Every route needs a signed-in caller: the generated auth handler turns the `Authorization: Bearer` token into the
caller (`ctx.actor`) and its tenant; nothing reads either from the input.

## Copy a pattern

| Task                                     | Copy from                                                                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| A tenant-owned model and its table       | `notes/models/note.model.ts` (`BelongsToTenant`), `notes/database/migrations/0001-create-notes.migration.ts` (`t.belongsToTenant()`) |
| A write with idempotency and an event    | `notes/actions/create-note.action.ts` (`Idempotency.Required`, `note.record(NoteCreated.create(...))`)                 |
| A typed refusal                          | `notes/errors/empty-note-update.error.ts` and its use in `notes/actions/update-note.action.ts`                          |
| A cursor-paged list query                | `notes/queries/list-notes.query.ts`, `notes/schemas/list-notes-input.schema.ts` (the cursor typed as a public id)      |
| Permissions and risk                     | `notes/access/note.permissions.ts`, `activity/access/activity-entry.permissions.ts`                                    |
| An integration event                     | `notes/events/note-created.event.ts` (ids only)                                                                        |
| A listener in a sibling module           | `activity/listeners/record-note-created.listener.ts` (subscribed by the type of `handle`'s first parameter)            |
| A scheduled job that runs per tenant     | `activity/actions/prune-activity.action.ts` (`job.cron` with `perScope`, retries, back-off, dead letter, `unique`)      |
| A test through the generated wiring      | `activity/__tests__/activity-feed.test.ts` (`createTestingModule`, `drainOutbox`, `tick`, `drainQueue`)                |
| Sign-in in a test                        | `notes/__tests__/sign-in.test.ts` (a signed ES256 token through `CallAuthenticator`, then the pipeline as that caller) |
| Tenant isolation on Postgres             | `notes/__tests__/note-isolation.int.test.ts`, `activity/__tests__/activity-isolation.int.test.ts` (the NOBYPASSRLS role) |
| Pinning a surface in the manifest        | `notes/__tests__/note-manifest.test.ts`, `activity/__tests__/activity-manifest.test.ts`                                |

Paths are under `src/modules/`.

## How a change flows

1. A signed-in user calls `PATCH /app/notes/:noteId`. The pipeline checks `notes.note.update` where the caller acts,
   validates the input, opens the tenant's isolation transaction and runs `UpdateNoteAction`, which records
   `NoteUpdated` on the note.
2. The row and the event commit together: the event reaches the outbox in the same transaction, so a rolled-back call
   announces nothing.
3. The outbox relay hands the committed event to the service's inbox, which runs `RecordNoteUpdatedListener` once per
   event id, as the call's actor in its tenant. The feed entry takes that tenant from the running call.
4. At 03:30 UTC the scheduler pushes one `activity.activity_entry.prune@1` job per tenant (tenancy's `CronScopes`
   driver lists the tenant nodes). The queue worker runs each through the pipeline in that tenant's isolation, retried
   with back-off and dead-lettered when every attempt fails.

## Tests

| Command                   | Runs                                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `stackra test`            | The unit tests: each action, query, listener and job with a stand-in service; the views and the refusal; the committed manifest's surfaces; sign-in through the generated wiring; and the activity feed end to end on the generated wiring with the memory drivers (events after the commit, the listeners, the cron through the queue) |
| `stackra test --tier int` | Postgres (Docker), as the NOBYPASSRLS service role: the five note operations through the real pipeline with the real idempotency store, isolation driver, unit of work and IAM access control; tenant isolation of notes and of the activity feed (each tenant's feed only, the job prunes only its own tenant's rows, no tenant reads nothing, the policy forced); and gen's own `tenant-isolation.int.test.ts` audit |

A test through the generated wiring picks the memory drivers, the outbox publisher to the service's own inbox
(`useDrivers({ EventPublisher: "inbox" })`) and the tenants a per-tenant cron fans out to (the memory `CronScopes`
driver's `scopes`).

## Commands

| Command                                        | Does                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `stackra gen`                                  | Writes the wiring, entries, migrations and Encore app, and the manifest and openapi |
| `stackra gen --check`                          | Fails when the committed `stackra.manifest.json` or `openapi.json` is stale         |
| `stackra test` / `stackra test --tier int`     | The unit tests / the integration tests (Docker)                                     |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | The usual checks                                                                    |
