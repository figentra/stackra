# @figentra/service-example

The reference example service: one complete resource, **notes**, from the model to the routes, the way a Stackra service
is written. It is a test bed for the packages and the generator, not a product feature
([ADR 0075](../../apps/docs/src/docs/adr/0075-stackra-ships-packages-figentra-os-ships-services.mdx)). Plain TypeScript, no Encore
file here (ADR 0124): `stackra gen` writes the Encore app into `.stackra/`, and nobody writes `main.ts`. See
[`services/`](../README.md) for the rules.

A note is a title and a text a tenant's user wrote. It is **tenant-owned**: every row carries its tenant, and the
database refuses to show it to anyone else.

| Operation | Key                   | Route                  | Permission          | Risk | Notes                                              |
| --------- | --------------------- | ---------------------- | ------------------- | ---- | -------------------------------------------------- |
| Create    | `notes.note.create@1` | `POST /app/notes`      | `notes.note.create` | L2   | `Idempotency-Key` required; records `note.created` |
| Get       | `notes.note.get@1`    | `GET /app/notes/:id`   | `notes.note.read`   | L0   | another tenant's note is `not_found`               |
| List      | `notes.note.list@1`   | `GET /app/notes`       | `notes.note.read`   | L0   | newest first, cursor pages                         |
| Update    | `notes.note.update@1` | `PATCH /app/notes/:id` | `notes.note.update` | L2   | a field left out is kept; records `note.updated`   |
| Delete    | `notes.note.delete@1` | `DELETE /app/notes/:id`| `notes.note.delete` | L2   | records `note.deleted`                             |

Callers are users and agents (`ActorKind.User`, `ActorKind.Agent`); the read operations are MCP tools too.

## What it shows

| Concern        | Where                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Model          | `models/note.model.ts`: `Model.with(HasPublicId("not"), BelongsToTenant, Timestamps)`, field rules as `@Str` decorators                  |
| Migration      | `database/migrations/0001-create-notes.migration.ts`: `t.belongsToTenant()` adds `tenant_id` and a forced row-level policy               |
| Actions        | `actions/*.action.ts` and `queries/*.query.ts`: one class each, key and actors in `Action({ ... })`, behaviour in `handle`               |
| Validation     | `schemas/*.schema.ts`: input and output shapes; the `@Str` bounds are enforced before `handle`                                           |
| Permissions    | `access/note.permissions.ts`: the risk of each verb; gen derives `notes.note.<verb>` and refuses a write below L2                        |
| Tenancy        | the call's tenant is the one `BelongsToTenant` rows take; nothing reads a tenant from the input; `NoteService` runs under the policy      |
| Events         | `events/note-*.event.ts`: integration events recorded on the model (`note.record(...)`), ids only, sent with the row's transaction       |
| Errors         | `errors/empty-note-update.error.ts`: a typed refusal with a stable code (`empty_note_update`, HTTP 400)                                   |
| Factory        | `database/factories/note.factory.ts`, for tests and demo data                                                                            |

## Tests

| Command                     | Runs                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `stackra test`              | 30 unit tests: each action and query with a stand-in service, the view mapping, the refusal, the recorded events, and the committed manifest (permissions, risk, the irreversible delete and its `destructiveHint`, the typed cursor) |
| `stackra test --tier int`   | Postgres (Docker): `note-pipeline` runs the five operations through the real actions pipeline, with the real idempotency store, the tenant isolation driver and the unit of work; `note-isolation` proves, as the `NOBYPASSRLS` service role, that tenant B cannot list, get, update or delete tenant A's notes and that a read with no tenant returns none; and gen's own `tenant-isolation.int.test.ts` audit |

Most integration tests bind an allow-all access control, so that what they prove is the service's behaviour and the database's
isolation. A second suite in `note-pipeline` runs the real IAM access control (`IamAccessControlDriver` over a policy with a
writer and a reader role): a caller without `notes.note.create` is refused and nothing is written, a reader reads but cannot
update or delete, and a caller with no grant holds nothing. A malformed list cursor is refused as invalid input (a client error)
before the query runs.

## Commands

| Command                                        | Does                                                                                         |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `stackra gen`                                  | Writes the wiring, entries, migrations and Encore app into `.stackra/` and the manifest      |
| `stackra gen --check`                          | Fails when the committed `stackra.manifest.json` and `openapi.json` are stale                |
| `stackra test` / `stackra test --tier int`     | The unit tests / the integration tests (Docker)                                              |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | The usual checks                                                                             |
