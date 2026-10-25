# AGENTS — @stackra/scheduler

Cron dispatch of the job actions whose `job` option has a `cron`, and per-scope schedules kept as data (ADR 0148
decisions 4 and 5). Member at `packages/runtime/scheduler` (`tier:lib`), in the programming model v3.1 shape (ADR 0294,
0305). Entries `.`, `./contracts`, `./node`, `./testing`.

## Where code goes

| You are writing…                            | It goes in…                                               |
| ------------------------------------------- | --------------------------------------------------------- |
| The configuration (`SchedulerConfig`)       | `src/config/scheduler.config.ts`                          |
| Its options shape                           | `src/core/schemas/scheduler-options.schema.ts`            |
| Its shipped zod schema (`SchedulerConfig$`) | `src/core/constants/scheduler-config-schema.constant.ts`  |
| A port, a stored type or its enum           | `src/contracts/{ports,types,enums}/`                      |
| An isomorphic driver, refusal, service      | `src/core/{drivers,errors,services}/`                     |
| A server driver                             | `src/node/drivers/`                                       |
| A migration                                 | `src/node/database/migrations/<NNNN>-<name>.migration.ts` |
| A test helper                               | `src/testing/{functions,constants}/`                      |
| A test                                      | `__tests__/<name>.<kind>.test.ts` beside it               |

## Entries and barrels

- `src/{core,contracts,node,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` imports it, `node` imports `core`, `testing` imports `core`. Nothing in `.`
  touches a database: the Postgres driver is `./node`'s.
- `SchedulerConfig$` mirrors `SchedulerOptions` by hand until gen compiles this package's schemas; change both together.
- `SCHEDULE_DRIVERS` names each `ScheduleDriver` driver by its file prefix; a new driver adds its name there.
- `./testing` registers its plugin when imported; `sideEffects` stays `false`.

## This package

- The scheduler only dispatches (ADR 0078 decision 6): every run is a `QueueService.push`; never call an action's
  `handle` and never do work in a tick.
- One runner per tick through `Locks.tryWith("scheduler:tick", ...)`; the watermarks, not the lock, keep a second tick
  of the same minute from pushing twice. Advance the watermarks in the same tick as the pushes, last.
- A driver stores; it never parses a cron, reads a clock or pushes. The service passes every instant.
- The cron parser stays the classic five fields (the shape `Action({ job: { cron } })` checks). No croner: no catalog
  carries it, and a new dependency needs `dependency-steward` and the owner.
- `cronRuns` steps minute by minute over a range the caller bounds; keep `catchUpWindow` capped at one day.
- Raw SQL only in `PostgresScheduleDriver`, every value bound, every row read through zod, each statement with a
  `// raw-sql:` reason (ADR 0160). The tables carry no row-level security (the tick reads every scope), so a scope's
  read or delete binds `scope_id` itself. A released migration is frozen; a change is a new migration.
- No tenant word is declared here (R-59, ADR 0323): a scope is a `ScopeRef`. `perTenant` is read only because it is
  the name of `@stackra/actions`' `JobCron` option.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data           | Where                                     | Handling                                                                         |
| -------------- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| Schedule input | `scheduler.schedules.input` (jsonb)       | The input its scope saved for every run; deleted with the schedule; never logged |
| Scope          | `scheduler.schedules.scope_id/scope_path` | Public ids and paths only                                                        |
