# @stackra/scheduler

Stackra scheduler: cron dispatch of the actions whose `job` option carries a `cron`, and per-scope schedules kept as
data. Once a minute one runner finds the runs that came due, catches up the ones it missed within a bounded window, and
pushes one job per run through `@stackra/queue` (ADR 0148 decisions 4 and 5, ADR 0078 decision 6).

**Tier:** `tier:lib` (`packages/runtime/scheduler`). Entries `.`, `./contracts`, `./node` and `./testing`. Depends on
`@stackra/actions`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/database`,
`@stackra/errors`, `@stackra/locking`, `@stackra/queue`, `@stackra/validation` and zod.

## What is here

| Symbol                                                | Entry         | Use                                                                                                      |
| ----------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `SchedulerService`                                    | `.`           | `tick(at?)`, `run({ signal })`, `schedule(Action, options)`, `unschedule(scope, id)`, `schedules(scope)` |
| `registerScheduledJobs`                               | `.`           | gen's entry registers the job actions with their locked keys                                             |
| `parseCron`, `cronRuns`, `CronFields`                 | `.`           | a five-field cron read into its values; the runs of one in a time zone over a range                      |
| `InvalidCronError`, `InvalidTimeZoneError`            | `.`           | `invalid_cron` and `invalid_time_zone`, both `Validation` refusals                                       |
| `SchedulerConfig`, `SchedulerConfig$`                 | `.`           | key `scheduler`: `driver` (`postgres` default, `memory`), `catchUpWindow`, `misfire`                     |
| `SchedulerOptions`, `ScheduleOptions`, `TickResult`   | `.`           | the shape of `SchedulerConfig`; what `schedule` takes; what `tick` did                                   |
| `MemoryScheduleDriver`, `MemoryCronScopesDriver`      | `.`           | the drivers for tests and a single process                                                               |
| `ScheduleDriver`, `CronScopes`, `Schedule`, `Misfire` | `./contracts` | the schedule store port, the per-scope cron scopes port, a stored schedule, the policies                 |
| `PostgresScheduleDriver`                              | `./node`      | the default driver: `scheduler.schedules` and `scheduler.watermarks`                                     |
| `tick`                                                | `./testing`   | one tick of the testing app compiled last, ready for `drainQueue`                                        |

## A cron is a job action's option

```ts
export class ExpireUnpaidOrdersAction extends Action({
  key: "order.expire_unpaid",
  actors: [ActorKind.System],
  job: {
    queue: Queues.Maintenance,
    unique: true,
    timeout: "2m",
    cron: { schedule: "*/5 * * * *", perScope: true, input: { batchSize: 100 } },
  },
}) { ... }
```

- The schedule is five fields in UTC: minute, hour, day of the month, month, day of the week; `*`, values, ranges
  `a-b`, steps `/n`, lists, month and weekday names, 7 as Sunday. When both day fields are restricted a day matches
  when either does, as in classic cron.
- `perScope: true` pushes one job per scope the bound `CronScopes` driver lists, each in its scope; without it one job
  runs for the platform. Every run gets `input` (`{}` when absent).
- A scheduler handler only dispatches: the action does the work, run by the queue worker with the job's retries,
  timeout and dead letter. A `unique` job of a scope that still waits or runs is not pushed again.

## Per-scope schedules are data

```ts
const schedule = await scheduler.schedule(SendDigestAction, {
  scope: ctx.scope, // the caller's authenticated scope
  cron: "0 8 * * mon",
  timeZone: "Asia/Dubai",
  input: { audience: "buyers" },
  misfire: Misfire.Once,
});
await scheduler.unschedule(ctx.scope, schedule.id);
```

A schedule names its action by the locked job key, so it only references registered code (ADR 0154). The cron is read
in the schedule's time zone; across a daylight-saving change a skipped wall time does not run that day and a repeated
one runs at both instants. No run from before the schedule was made is pushed.

`SCHEDULED_JOBS` is annotated with `AnyClass<Action>` maps, so the declarations name the exported `Action` type
(STA-1220).

## Ticks, misfires and one runner

- `tick(at)` takes the lock `scheduler:tick` with `Locks.tryWith`: every instance ticks, one runs, the others get
  `{ ran: false }`. With the Postgres drivers the pushes and the watermarks commit in the lock's transaction.
- Each cron and schedule keeps a watermark (the last tick that evaluated it). A tick looks for runs after the
  watermark, never further back than `catchUpWindow` (one hour by default, one minute to one day). A cron new to the
  store looks back one minute.
- `Misfire.CatchUp` (default) pushes each missed run, `Misfire.Once` one for all of them, `Misfire.Skip` only a run of
  the current minute. A cron takes `SchedulerConfig.misfire`; a schedule keeps its own.
- In SaaS gen's Encore CronJob calls `tick` every minute; on-prem `run({ signal })` is the timer and logs a failed tick
  (`scheduler.tick_failed`) through the `Logger` before the next one.

## Encore CronJob in SaaS

`encoreCronJobs()` lists the CronJobs gen emits for a SaaS service: one per registered action whose `job` option has
a `cron` (its kebab id, its schedule, an endpoint that calls `SchedulerService.fire(key)`), and `scheduler-schedules`
every minute, whose endpoint calls `tick(undefined, { crons: false })` for the stored per-scope schedules. Encore runs
one invocation of a CronJob at a time, so `fire` takes no lock. On-prem, `run` stays the timer.

## Testing

```ts
import { drainQueue } from "@stackra/queue/testing";
import { tick } from "@stackra/scheduler/testing";

await tick(new Date("2026-10-24T03:30:20Z"));
await drainQueue(); // runs the job the cron pushed
```

`tick` uses the `SchedulerService` of the testing app compiled last; an app that binds none rejects.
