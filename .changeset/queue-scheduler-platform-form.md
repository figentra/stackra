---
"@stackra/queue": minor
"@stackra/scheduler": minor
---

`queue.jobs` and `scheduler.schedules` are tenant-owned in the platform form (migrations
`queue.0003_contract_queue_tenancy` and `scheduler.0002_contract_scheduler_tenancy`): each gets a nullable
`tenant_id`, filled from `app.tenant_id` by default (a NULL row is the platform's), forced row-level security and the
platform policies. `queue.job_batches` and `scheduler.watermarks` stay platform tables. Cross-owner readers claim
through system functions that return ids, owners and order or lease columns only, and load or change each row in its
owner: `queue.reserve_job` (the worker's lease: status, attempts and `locked_until` only), `queue.claim_dead_jobs`,
`queue.unique_key_holders` (a redrive's check for a live job of any owner holding the same unique key; the unique
index stays global) and `scheduler.claim_schedules`.

Upgrade: drain the queue before you migrate: let reserved and pending jobs finish or fail, then delete those dead
jobs. The queue migration backfills a job at a tenant node (a scope path of three labels) from its scope and keeps a
job with no scope, at the root or at a product node as a platform job; the scheduler migration does the same for
schedules (`nlevel(scope_path) = 3`). Each refuses, changing nothing, while a row sits below a tenant node, naming
the count and the remedy: for jobs, drain the queue as above; for schedules, note each one's job, cron, time zone,
input and missed-run policy, unschedule it, migrate again, then schedule it again from a call in its scope.

The worker loads each reserved job in its owner and records every outcome there (removed, retried, released or
dead-lettered); it queues a chain's next link in a transaction of its own (`requiresNew`) in the job's owner. A job a
broker delivered keeps its dead letter in its own scope's isolation. The scheduler's lock now covers only the claim
of every owner's schedules and, taken again after the pushes, the watermark advance: each owner's runs (a schedule's,
or a per-scope cron's in one scope) are pushed between them, in a `requiresNew` transaction in that owner's isolation.
Dispatch is at least once with no duplicate: migration `scheduler.0003_create_fires` adds `scheduler.fires` (platform
form, keyed by fire key and fire time), and each run is pushed only when its fire record is new, in the push's own
transaction, before the watermark moves. A tick that dies between the pushes and the advance pushes nothing again,
even when the first jobs already finished; a key whose push failed keeps its watermark. A watermark never moves back.
`ScheduleDriver` gains `recordFire(key, at)` and `forgetFires(key, through)`; its `remove` also deletes the
schedule's fires.

Breaking port changes, for a custom driver:

- `QueueDriver`: `reserve` returns a `JobClaim` (id, `ownerId`) instead of the job; `load(id)` returns the job in the
  caller's isolation; `claimDead({ queue?, id?, limit })` claims dead letters across owners. `deadLetters` and
  `redrive` run in the caller's isolation.
- `ScheduleDriver`: `schedules(scope)` takes its scope (no scope no longer lists every owner's); `claim()` returns
  `ScheduleClaim`s (id, `ownerId`, key, cron, time zone, missed-run policy, creation instant) and `load(id)` the
  schedule.

New: `JobClaimNotLoadedError` and `JobRowIsolationMissingError` (`@stackra/queue`), `ScheduleClaimNotLoadedError` and
`ScheduleRowIsolationMissingError` (`@stackra/scheduler`): a claimed row that does not load in its owner, or an owned
row with no `CallIsolation` bound, fails the work; it is never skipped. `queue:failed` and `queue:retry` inject the
`Container` and `SchedulerService` takes it as its last argument; each reads `CallIsolation` from it optionally, so
an app without tenancy still boots and runs its platform rows as before. `ScheduleDriver` also gains
`transaction(work)` (a `requiresNew` transaction on Postgres, `work` as it is in memory), in which each owner's fire
records and pushes commit together.
