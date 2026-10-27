# AGENTS — @stackra/queue

The runtime of an action's `job:` option: the queue service, the worker, the `QueueDriver` port with the memory and
Postgres drivers, the `JobDispatcher` driver behind `ctx.dispatch`, and the test helpers (ADR 0148, ADR 0305 rule 28).
Member at `packages/runtime/queue` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./node`, `./testing`.

## Where code goes

| You are writing…                        | It goes in…                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------- |
| The configuration (`QueueConfig`)       | `src/config/queue.config.ts`                                                |
| Its options shape                       | `src/core/schemas/queue-options.schema.ts`                                  |
| Its shipped zod schema (`QueueConfig$`) | `src/core/constants/queue-config-schema.constant.ts`                        |
| The port, a stored type or its enum     | `src/contracts/{ports,types,enums}/`                                        |
| An isomorphic driver, refusal, service  | `src/core/{drivers,errors,services}/`                                       |
| The worker or a server driver           | `src/node/{services,drivers}/`                                              |
| A migration                             | `src/node/database/migrations/<NNNN>-<name>.migration.ts`                   |
| A test helper or matcher                | `src/testing/{functions,constants,types}/`, `src/testing/<name>.matcher.ts` |
| A test                                  | `__tests__/<name>.<kind>.test.ts` beside it                                 |

## Entries and barrels

- `src/{core,contracts,node,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` imports it, `node` imports `core`, `testing` imports all three. Nothing in `.`
  touches a database: the worker (it opens a job's scope session) and the Postgres driver are `./node`'s.
- `QueueConfig$` mirrors `QueueOptions` by hand until gen compiles this package's schemas; change both together.
- `QUEUE_DRIVERS` names each driver by its file prefix; a new driver adds its name there.
- `./testing` registers the plugin and the matcher when imported; `sideEffects` stays `false`.

## This package

- A driver stores and reserves; it never runs a job, computes a backoff or reads a clock. The worker passes `now` and
  the retry time, so every driver behaves the same.
- `QueueWorkerService.process` hands a delivered job to `driver.claim` before it runs; a store driver keeps the default
  (the job as it is, already reserved). The `broker` driver holds a claimed job in memory only until the worker records
  its outcome in the same call, so `retry`, `deadLetter` and `remove` must follow its `claim` in one process.
- The worker runs every attempt through `ActionPipeline`; never call `handle` directly and never add a pipeline step.
  The job actor is `job` when the action lists `ActorKind.Job`, else `system`; a queued call of an action without a
  `job` option runs as its caller.
- A job key is the registered locked key (`registerJobs`, from gen's entry), else the written key; a worker that meets
  an unknown key dead-letters the job, never drops it.
- Raw SQL only in `PostgresQueueDriver`, every value bound, every row read through zod, each statement with a
  `// raw-sql:` reason (ADR 0160). A released migration is frozen; a change is a new migration.
- No tenant word is declared here (final review R-59, ADR 0323): a scope is a `ScopeRef`.
- No `@Job` or `@Queue`: job, queue and cron are typed sub-options of `Action({...})` (R-13).
- A broker publisher never imports `encore.dev`: generated topics reach the `topic` driver as structural objects
  through `registerBrokerTopics`. `BROKER_PUBLISHERS` names each driver by its file prefix.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).
- Annotate every export whose inferred type would reach an unexported or deep-path type (`ExtensionBase`, `ActionBase`,
  `PassBase`, a provider's `bin/` class, `@types/react`'s `Element`): the declaration build fails with TS2883 (STA-1220).

## PII

| Data         | Where                                     | Handling                                                                                                              |
| ------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Job input    | `queue.jobs.input` (jsonb), memory driver | The action's input as its caller sent it; removed when the job finishes, kept while it is dead-lettered; never logged |
| Origin actor | `queue.jobs.origin` (jsonb)               | Public ids and kinds only, for the job actor's `onBehalfOf`                                                           |
| Last error   | `queue.jobs.last_error` (jsonb)           | The error's code and message; the worker adds no input and no stack                                                   |
