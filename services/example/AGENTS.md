# AGENTS — @figentra/service-example

The reference example service. Member at `services/example` (`tier:service`), in the programming model v3 shape: gen
writes the entry, the wiring and the Encore app into `.stackra/`; nobody writes `main.ts`. Two feature modules,
`notes` and `activity`. Read the README for what each file shows.

## Rules that fail the build

- No Encore file or import, no `main.ts`, no tool config: gen writes them into `.stackra/`.
- No `"sideEffects": false` in `package.json`: the generated Encore files import `./database` for its side effect, and a
  bundler that honours the flag drops that import, so the app fails at boot with "no database url was provided".
- Never import another service; use its generated client or its events. Between the two modules, `activity` imports
  only the notes module's public `events/` group.
- The tenant is the call's, never the input's: no `tenantId` field on an input, no tenant read from a header or body.
  A tenant-owned table is declared with `BelongsToTenant` and `t.belongsToTenant()`; never hand-write its policy.
- Every read and write goes through the module's service inside an action, a query, a listener's delivery or a job's
  run, so the isolation transaction is open; a direct query in a handler is a lint failure.
- A write is at least L2 and declares its `idempotency` (a job declares `unique` instead); a refusal is a class in
  `errors/` with a stable code; a delete for good declares `Effect.Irreversible`.
- Events are recorded on the model (`note.record(...)`) and carry ids only, never a title or a text. A listener does the
  work after the commit and never reaches back into the call that published.
- A job whose only actor is the system gets no route and no tool; a per-tenant cron sets `perScope: true`.
- One declaration per file; each file sits in its kind's group folder under `src/modules/<module>/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## Tasks

`pnpm turbo run <task> --filter=@figentra/service-example` — `build`, `typecheck`, `lint`, `test`, `test:int`, `format`,
`format:check`, `clean`. The isolation tests run in `test:int`, on Postgres, as the `NOBYPASSRLS` role: never in the unit
tier (`isolation-tier`, rule `tenancy` point 8).

## PII

| Data                    | Where                                    | Handling                                                                                                                                                  |
| ----------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A note's title and text | `notes.notes` (`title`, `body`)          | Free text a user writes, so it may hold personal data. Stored under the tenant's row-level policy, returned only to that tenant, never put in an event, a feed entry, a log or an error. |
| The author's identity   | not stored                               | A note does not record its author; only the owning tenant (`tenant_id`).                                                                                  |
| Activity feed entries   | `activity.activity_entries`              | A kind, a note's public id and a time: no personal data. Tenant-owned under the row-level policy; deleted after 90 days by the retention job.            |
