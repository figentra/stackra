# @stackra/queue

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
| `QueueService`                                      | `.`           | `push(Action, input, options)`, `deadLetters(queue?)`, `redrive(id)`                               |
| `QueueJobDispatcherDriver`                          | `.`           | the `JobDispatcher` driver behind `ctx.dispatch(Action, input)`                                    |
| `registerJobs`                                      | `.`           | gen's entry registers the job actions with their locked keys                                       |
| `backoffDelay`                                      | `.`           | the wait after a failed attempt, in milliseconds                                                   |
| `JobOutcome`, `JobRun`, `PushOptions`               | `.`           | how an attempt ended; what `push` takes                                                            |
| `JobTimedOutError`, `UnknownJobError`               | `.`           | `job_timed_out` (retryable) and `unknown_job` (dead-lettered at once)                              |
| `QueueConfig`, `QueueConfig$`                       | `.`           | key `queue`: `driver` (`postgres` default, `memory`)                                               |
| `QueueOptions`, `MemoryQueueDriver`                 | `.`           | the shape of `QueueConfig`; the driver for tests and a single process                              |
| `QueueDriver`, `QueuedJob`, `JobError`, `JobStatus` | `./contracts` | the port a driver implements and the stored job                                                    |
| `QueueWorkerService`                                | `./node`      | `connect(container)`, then `work(queue, { signal, concurrency })`, `drain()`, `process(job)`       |
| `PostgresQueueDriver`                               | `./node`      | the default driver: `queue.jobs`, reserved with `FOR UPDATE SKIP LOCKED`                           |
| `drainQueue`, `runJob`, `toDeadLetter`              | `./testing`   | run due jobs; run one job to its end; assert a dead letter                                         |

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

- **Postgres** (`./node`, default): rows of `queue.jobs`, created by this package's migration `queue.0001_create_jobs`.
  A reservation is one `UPDATE … WHERE id = (SELECT … FOR UPDATE SKIP LOCKED LIMIT 1)`; a unique job's conflict is the
  partial unique index on `unique_key`. A push inside an action's transaction commits with it.
- **Memory** (`.`): jobs in process memory, the input stored as JSON as Postgres stores it.

## Testing

```ts
import { drainQueue, runJob } from "@stackra/queue/testing";

await run(SendMessageAction, input, { as, idempotencyKey: "k1" });
await drainQueue(); // runs the DeliverMessageAction it dispatched

const job = await runJob(DeliverMessageAction, { messageId, html, text });
expect(job).toDeadLetter({ attempts: 6 });
```

`drainQueue` runs every job due now; `runJob` runs one job's attempts without waiting for the backoff. Both act on the
testing app compiled last, through its own queue driver.

## Broker publisher

`BrokerPublisher` (`./contracts`) hands a message `{ id, body }` to a named broker topic; `BrokerConfig` (key
`queue.broker`) picks the driver:

| Driver   | Entry    | Use                                                                                            |
| -------- | -------- | ---------------------------------------------------------------------------------------------- |
| `memory` | `.`      | the default: an in-process broker with `subscribe(topic, handler)` for tests                   |
| `topic`  | `.`      | the generated Encore Pub/Sub topics, registered by gen with `registerBrokerTopics`             |
| `valkey` | `./node` | one Valkey stream per topic (`XADD`, trimmed to `valkey.maxLength`), `QUEUE_BROKER_VALKEY_URL` |

The outbox's `broker` publisher publishes each integration event to the topic of its wire name through it.
