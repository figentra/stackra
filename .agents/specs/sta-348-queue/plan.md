# Plan: `@stackra/queue` wave 5

**Spec**: `.agents/specs/sta-348-queue/spec.md`

## Design

- Four entries through stand-in barrels (STA-339 replaces them): `./contracts` from `src/contracts/` (the leaf: the
  `QueueDriver` port, the `QueuedJob` and `JobError` types and the `JobStatus` enum), `.` from `src/core/` with
  `src/config/`, `./node` from `src/node/` (the worker, the Postgres driver and the job-table migration), `./testing`
  from `src/testing/`.
- `readJob(type)` reads the action's recorded `job` option (`kindOf`) with the defaults applied and the job key (the
  `registerJobs` key, else the written key, registered on first use); `QueueService` and the worker share it.
- `QueueService.push` mints a `job_` id, builds the waiting `QueuedJob` (queue, key, input, origin, scope,
  Idempotency-Key, a unique key of key and scope, lease = timeout + a minute) and stores it through the driver.
- `QueueWorkerService` is connected to a container (`connect`, as `EventBus.connect`), builds an `ActionPipeline` over
  it, and runs each reserved job: the actor (`job` or `system` on behalf of the caller, or the caller for a queued call),
  the Idempotency-Key, `Database.withScope` when the job has a scope, and an abort plus `JobTimedOutError` at the
  timeout. The outcome is recorded through the driver: remove, retry at `now + backoffDelay`, dead letter plus the
  `onDeadLetter` call in the unit of work, or remove plus a log line. `drain` runs due jobs until none is due; `work`
  loops per queue with a concurrency until a signal aborts.
- `MemoryQueueDriver` keeps slots in a map (the input as JSON); `PostgresQueueDriver` runs one parameterised statement
  per method on `queue.jobs`, created by `CreateJobsMigration`.
- `QueueJobDispatcherDriver` is the `queue` driver of `JobDispatcher`.
- The testing plugin connects a worker to every compiled app (the app's own queue when it binds one, else a memory
  queue); `drainQueue` drains it, `runJob` pushes one job and drains at each retry time until the job ends;
  `toDeadLetter` reads the result.
- `QueueConfig extends Config({ schema: QueueOptions })`, with `QueueConfig$` and the `DriverRegistry` entry beside it as
  @stackra/locking has them.

## Constitution Check

| Law                                   | Result | Note                                                                                                      |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/runtime/queue`; imports only `tier:lib` packages; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged; the Postgres driver uses the service's own connection                |
| Security                              | PASS   | every value is a bound parameter; the job actor comes from the verified caller, never from input          |
| HTTP and events                       | PASS   | no endpoint; the queued-call adapter is gen's; refusals are typed (`job_timed_out`, `unknown_job`)        |
| Tenancy                               | PASS   | no tenant word declared; a scope is a `ScopeRef` opened as the session of each attempt (spec open item)   |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests    |
| Not built yet (ADR 0227)              | PASS   | Postgres and memory only; no Kafka, NATS or Redpanda, no external queue service                           |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                 |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                         |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                 |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                        |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0148 stands, the gaps are listed in the spec                |

- Boundaries: runtime imports of actions, config, container, contracts, database, errors and validation; dev-only
  `@stackra/testing` and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: services `<Name>Service`, drivers `<Name>Driver`, refusals end in `Error`, the migration
  `CreateJobsMigration`, no `define` prefix; `Backoff`, `JobStatus` and `JobOutcome` are `Enum.of` values.

## Properties

- **P-001**: `package.json` names `@stackra/queue` at `packages/runtime/queue` and `exports` lists only `.`, `./contracts`, `./node` and `./testing` — Validates: FR-001
- **P-002**: each entry's `index.test.ts` lists exactly its values, with `Backoff` and `queues` in `.` and `drainQueue` and `runJob` in `./testing`, and `toDeadLetter({ attempts: 6 })` passes for a job with five retries — Validates: FR-002
- **P-003**: `buildConfig(QueueConfig)` equals `QueueConfig$.parse({})` with driver `postgres`, `memory` builds, and another name refuses — Validates: FR-003
- **P-004**: for every push, the stored job carries the action's queue, the caller, the scope and a lease of the timeout plus a minute; a second unique push of the same scope is skipped and one of another scope is stored — Validates: FR-004
- **P-005**: for every sequence of attempt outcomes, a job is removed when done, retried at `now` plus its backoff while attempts remain and the error is retryable, and otherwise dead-lettered with one `onDeadLetter` call or removed with one log line — Validates: FR-005
- **P-006**: `ctx.dispatch(Action, input)` stores one job whose origin is the calling actor and whose `causedBy` is the call id — Validates: FR-006
- **P-007**: for every method, the driver's SQL holds no value text and has as many placeholders as parameters; the memory driver hands each due job to one reservation at a time — Validates: FR-007
- **P-008**: `grep -rE "(const|let|class|interface|type|function) [A-Za-z]*[Tt]enant" packages/runtime/queue/src` and `grep -rE "@(Job|Queue)\b" packages/runtime/queue/src` find nothing — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------ |
| SaaS       | the same build; jobs live in each service's own Postgres until gen emits the Encore Topic driver |
| On-prem    | identical: the same build, no SaaS-only code path                                                |
| Air-gapped | identical: needs no network; Postgres holds the jobs in the deployment itself                    |
