# @stackra/queue

<!--
Stackra file contract:
Purpose: the package's reader guide: queued jobs, their options and defaults, the drivers, the worker and the testing helpers.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0148; ADR 0294; ADR 0305; owner D10 2026-10-28 (stackra-223: one RetryPolicy, backoffDelay and Duration).
-->

Stackra queue: the runtime of an action's `job:` option. It stores jobs, runs each attempt through the action pipeline
with a timeout, retries with backoff and jitter, keeps a dead-letter queue with redrive, and ships the memory and
Postgres (`SKIP LOCKED`) drivers (ADR 0148, ADR 0305 rule 28).

**Tier:** `tier:lib` (`packages/runtime/queue`). Entries `.`, `./contracts`, `./node` and `./testing`. Depends on
`@stackra/actions`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/database`,
`@stackra/errors`, `@stackra/validation` and zod.

## What is here

| Symbol                                              | Entry         | Use                                                                                                |
| --------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `Backoff`                                           | `.`           | the `backoff` of a `job` option or a workflow step's `retry`: exponential (default), linear, fixed |
| `queues`, `QueueNames`                              | `.`           | `export const Queues = queues([...] as const)`, the enum gen writes into `#stackra/queues`         |
| `QueueService`                                      | `.`           | `push`, `chain(links)`, `batch(links)`, `progress(batchId)`, `deadLetters(queue?)`, `redrive(id)`  |
| `QueueJobDispatcherDriver`                          | `.`           | the `JobDispatcher` driver behind `ctx.dispatch(Action, input)`                                    |
| `registerJobs`                                      | `.`           | gen's entry registers the job actions with their locked keys                                       |
| `JOB_BACKOFF`                                       | `.`           | a job's waits (10 s base, half again, 1 h cap) for `backoffDelay`                                  |
| `JobOutcome`, `JobRun`, `PushOptions`               | `.`           | how an attempt ended; what `push` takes                                                            |
| `JobTimedOutError`, `UnknownJobError`               | `.`           | `job_timed_out` (retryable) and `unknown_job` (dead-lettered at once)                              |
| `QueueConfig`, `QueueConfig$`                       | `.`           | key `queue`: `driver` (`postgres` default, `memory`, `broker`)                                     |
| `JobNotDueError`                                    | `.`           | `job_not_due`: a broker delivered a job before its `runAt` (redelivered later)                     |
| `BrokerQueueDriver`                                 | `./node`      | the `broker` driver: jobs ride the generated Pub/Sub topics, dead letters stay in `queue.jobs`     |
| `QueueOptions`, `MemoryQueueDriver`                 | `.`           | the shape of `QueueConfig`; the driver for tests and a single process                              |
| `QueueDriver`, `QueuedJob`, `JobError`, `JobStatus` | `./contracts` | the port a driver implements and the stored job                                                    |
| `JobBatch`, `JobThrottle`, `ChainedJob`             | `./contracts` | a batch's progress, a job's throttle, a chain link still to run                                    |
| `QueueWorkerService`                                | `./node`      | `connect(container)`, then `work(queue, { signal, concurrency })`, `drain()`, `process(job)`       |
| `PostgresQueueDriver`                               | `./node`      | the default driver: `queue.jobs`, reserved with `FOR UPDATE SKIP LOCKED`                           |
| `drainQueue`, `runJob`, `toDeadLetter`              | `./testing`   | run due jobs; run one job to its end; assert a dead letter                                         |
| `runQueueConformance`, `QUEUE_CONFORMANCE_CASES`    | `./testing`   | the `QueueDriver` conformance suite every driver passes                                            |

`Backoff` is the @stackra/contracts enum, re-exported here; the wait is the contracts `backoffDelay` over
`JOB_BACKOFF` (stackra-223), with the values the queue's own formula had.

## A job is an action

```ts
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { Backoff } from "@stackra/queue";
import { Queues } from "#stackra/queues";

export class DeliverMessageAction extends Action({
  key: "message.deliver",
  actors: [ActorKind.System],
  job: {
    queue: Queues.Delivery,
    retries: 5,
    backoff: Backoff.Exponential,
    deadLetter: true,
    onDeadLetter: "markFailed",
  },
}) {
  async handle(input: DeliverMessageInput, ctx: ActionContext): Promise<DeliverMessageOutput> { ... }

  async markFailed(input: DeliverMessageInput): Promise<void> { ... }
}
```

- Queue it from another action with `ctx.dispatch(DeliverMessageAction, input)`, usually inside `ctx.afterCommit`. The
  job keeps the caller as `onBehalfOf` and the call's scope (`ctx.scope`), and runs as the `job` actor when the action
  lists `ActorKind.Job`, else as the `system` actor (`Action({ job })` requires one of the two).
- When the `job` option leaves a field out: queue `default`, three retries, exponential backoff, a five-minute timeout.
  A reservation holds for the timeout plus a minute, so a worker that dies hands the job to the next one.
- A refusal that is not retryable ends the job at once; any other error, a timeout included, is retried while attempts
  remain. After the last attempt a `deadLetter: true` job waits in the dead-letter queue and `onDeadLetter` is called
  once with its input; any other job is removed and the failure is logged (`queue.job_dropped`).
- `unique: true` queues one job per scope while it waits or runs; a second push is skipped.
- Every attempt carries an Idempotency-Key (the queued call's, else `job:<id>` when an idempotency store is bound), so an
  attempt that ran but was not recorded replays instead of running twice.

## Fair queues, throttles, batches and chains

ADR 0148 decision 2: one scope must not starve the others.

- **Priority.** `job.priority` (a whole number, `0` by default; `push(..., { priority })` overrides it per push). Higher
  runs first among the due jobs of a queue.
- **Fairness.** Among jobs of equal priority, a reservation picks the scope (`ScopeRef.id`, platform jobs share one)
  with the fewest jobs running on that queue, then the oldest `runAt`.
- **Per-scope cap.** `job.scopeConcurrency: n` never runs more than `n` jobs of the action's queue and one scope at once.
- **Throttle.** `job.throttle: { perMinute, key }` takes one token from the bound `RateLimitStore` (bucket
  `queue.throttle:<key>`, shared by every job naming the key) before each attempt; with none free the job waits for the
  next token (`JobOutcome.Throttled`) and the attempt is not counted. A throttled job with no store bound fails its
  attempt rather than run unthrottled.
- **Chains.** `queue.chain([{ type, input }, ...], options)` queues the first link; each next link is queued once the
  one before it is done. A link that fails for good stops the chain, and its dead letter keeps the rest, so a redrive
  resumes it.
- **Batches.** `queue.batch([{ type, input }, ...], options)` opens a batch (`jbt_…`) and tags its jobs; each job's final
  outcome counts as done or failed, and `queue.progress(id)` answers `{ total, done, failed }`. A unique job skipped at
  push counts as done.

`priority`, `scopeConcurrency` and `throttle` are read from the `job` option, but @stackra/actions' `JobOptions` does
not list them yet: pass them through a constant typed `JobOptions & JobFairnessOptions` until it does. The broker
driver keeps batches but applies neither priority nor the cap: the broker delivers in its own order.

## Queued calls, scopes and the scheduler

`QueueService.push(Action, input, { origin, scope, idempotencyKey, causedBy })` is the one way in. A transport that
receives a queued call (`Prefer: respond-async`, sent by `client.x.y.queue(input)` of @stackra/clients) pushes it with
the verified caller as `origin`, the resolved `ScopeRef` and the Idempotency-Key, and answers at once; an action without
a `job` option then runs as its caller. A job with a `scope` runs each attempt inside `Database.withScope(scope, ...)`
and with that scope as the call's, so the handler reads `ctx.scope`. `ctx.dispatch` queues the job in the calling
action's scope. The scheduler pushes a cron job once per scope with that scope.

## Running jobs

```ts
import { QueueWorkerService } from "@stackra/queue/node";

worker.connect(container);
await worker.work(Queues.Maintenance, { concurrency: 4, signal: shutdown.signal });
```

`work` loops until the signal aborts: it reserves the next due job of the queue, runs it, and polls every second when
none is due. Redrive a dead letter with `queue.redrive(id)`; it runs again with all its attempts.

`JOB_TYPES` is annotated with `AnyClass<Action>` maps, so the declarations name the exported `Action` type (STA-1220).

## Drivers

- **Postgres** (`./node`, default): rows of `queue.jobs`, created by this package's migrations `queue.0001_create_jobs`
  and `queue.0002_add_job_fairness` (which also creates `queue.job_batches`). A reservation is one
  `UPDATE … WHERE id = (SELECT … FOR UPDATE OF job SKIP LOCKED LIMIT 1)` ordered by priority, the scope's running count
  (a lateral count) and `run_at`; a unique job's conflict is the partial unique index on `unique_key`. A push inside an
  action's transaction commits with it. Two workers reserving at the same instant may each let one job past a scope's
  cap.
- **Memory** (`.`): jobs in process memory, the input stored as JSON as Postgres stores it.
- **Broker** (`./node`, `queue.driver: broker`): for SaaS on Encore Pub/Sub. A push publishes the job through the
  `BrokerPublisher` to `queue.<queue>`, the topic `emitEncoreQueues` generates for each job queue, and the generated
  subscription runs it with `worker.process(job)`. `process` first calls the driver's `claim`, which marks the job
  running with one more attempt, or refuses `job_not_due` when it arrived before its `runAt` so the broker delivers it
  again after its own retry backoff (a delayed job or a retry waits at that granularity, not to the millisecond). A
  retry is published again with its `runAt` and last error under the message id `<job>:<attempt>`. A dead letter is
  kept in the service's `queue.jobs` (the Postgres migration must run), where `deadLetters` lists it and `redrive`
  publishes it again. Nothing is polled: `reserve` answers no job. A unique key is not held on the broker: a unique
  job pushed twice runs twice.

## Health check

`QueueHealthIndicatorDriver` (`.`) is this package's `HealthIndicator` driver, named `queue`: it lists at most one dead letter. Bind it and
`@stackra/app`'s `/readyz` runs it with the other bound indicators. `health` in this package's config tunes it:

| Field      | Default | Meaning                                                                   |
| ---------- | ------- | ------------------------------------------------------------------------- |
| `timeout`  | `PT2S`  | How long the probe may take before it counts as failed.                   |
| `critical` | `true`  | A failed probe is `down` and fails `/readyz`; `false` reports `degraded`. |

A failed probe never throws; its detail names the error type only.

## Testing

```ts
import { drainQueue, runJob } from "@stackra/queue/testing";

await run(SendMessageAction, input, { as, idempotencyKey: "k1" });
await drainQueue(); // runs the DeliverMessageAction it dispatched

const job = await runJob(DeliverMessageAction, { messageId, html, text });
expect(job).toDeadLetter({ attempts: 6 });
```

`drainQueue` runs every job due now; `runJob` runs one job's attempts without waiting for the backoff or a throttle. Both
act on the testing app compiled last, through its own queue driver.

A driver proves the port with `runQueueConformance(() => driver)`, expecting no mismatches; a broker-delivered driver
skips the cases that reserve (`{ skip: [...] }`).

## Broker publisher

`BrokerPublisher` (`./contracts`) hands a message `{ id, body }` to a named broker topic; `BrokerConfig` (key
`queue.broker`) picks the driver:

| Driver   | Entry    | Use                                                                                            |
| -------- | -------- | ---------------------------------------------------------------------------------------------- |
| `memory` | `.`      | the default: an in-process broker with `subscribe(topic, handler)` for tests                   |
| `topic`  | `.`      | the generated Encore Pub/Sub topics, registered by gen with `registerBrokerTopics`             |
| `valkey` | `./node` | one Valkey stream per topic (`XADD`, trimmed to `valkey.maxLength`), `QUEUE_BROKER_VALKEY_URL` |

The outbox's `broker` publisher publishes each integration event to the topic of its wire name through it.
