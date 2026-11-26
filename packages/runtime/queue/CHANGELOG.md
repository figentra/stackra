# @stackra/queue

## 0.33.1

### Patch Changes

- Updated dependencies [e885a38]
- Updated dependencies [bf2c6ea]
- Updated dependencies [e885a38]
  - @stackra/database@0.33.1
  - @stackra/contracts@0.33.1
  - @stackra/actions@0.33.1
  - @stackra/console@0.33.1
  - @stackra/config@0.33.1
  - @stackra/container@0.33.1
  - @stackra/errors@0.33.1
  - @stackra/validation@0.33.1
  - @stackra/testing@0.33.1

## 0.33.0

### Minor Changes

- ad4e5bf: A queued job's call knows which attempt it is: `ctx.attempt` (`{ number, last }`, the new `CallAttempt` type) on every call context, set by the queue worker through `CallOptions.attempt` and absent for a direct call. `last` is true when no retry follows, so a job that may give up (a quota it cannot read) can act on its last attempt instead of throwing again.

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [41a5ff0]
- Updated dependencies [246594d]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/actions@0.33.0
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/testing@0.33.0
  - @stackra/database@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/console@0.33.0
  - @stackra/container@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
  - @stackra/config@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/database@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/console@0.32.0
  - @stackra/testing@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/console@0.31.0
  - @stackra/testing@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- 98a8940: `queue.jobs` and `scheduler.schedules` are tenant-owned in the platform form (migrations
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
  `fire(key)`, the Encore CronJob entry point, pushes the cron's current slot (its last due time at or before now, in
  UTC) and records it under the same fire key a tick uses, so an Encore retry in the slot, or a tick of it, pushes
  nothing again; a call with no due time in the last day pushes once, unrecorded.
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

### Patch Changes

- 82dccb3: One shared owner-isolation helper. `@stackra/actions` now exports `inRowOwner(isolation, actorId, ownerId, id, work,
  missing?)`, `boundIsolation(resolver)`, `ClaimNotLoadedError` (`claim_not_loaded`) and `RowIsolationMissingError`
  (`row_isolation_missing`) from its `.` entry, so the tenancy families no longer each keep a copy. Every caller keeps
  its own system actor id (`sys_outbox_relay`, `sys_queue_worker`, `sys_scheduler`, `sys_workflow_runner`,
  `sys_privacy_holds`), the same refusals and the same rule: an owned row with no isolation bound is refused, never
  skipped. Queue and scheduler keep their prefixed refusals and codes (`job_row_isolation_missing`,
  `schedule_row_isolation_missing`, and their claim-not-loaded ones) and pass them to `inRowOwner`.
  
  `@stackra/outbox` still re-exports `boundIsolation`, `ClaimNotLoadedError` and `RowIsolationMissingError` from its `.`
  entry for this release only; the re-exports go away in the next minor, so import them from `@stackra/actions`. The two
  refusals now appear under `@stackra/actions` in the manifests, with the same codes. `@stackra/workflow` no longer
  depends on `@stackra/outbox`; `@stackra/data-transfer` now depends on `@stackra/actions`.
- Updated dependencies [418e195]
- Updated dependencies [6005425]
- Updated dependencies [0394e56]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [d8d78f0]
- Updated dependencies [7b5a381]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [15dba8d]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/database@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/container@0.30.0
  - @stackra/console@0.30.0
  - @stackra/config@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/testing@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [11a19a7]
- Updated dependencies [45afd22]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/console@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/testing@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/database@0.28.0
  - @stackra/console@0.28.0
  - @stackra/testing@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [4a4d817]
  - @stackra/database@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/console@0.27.0
  - @stackra/testing@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [93e358e]
- Updated dependencies [9cee75d]
- Updated dependencies [a9f21b6]
  - @stackra/database@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/console@0.26.0
  - @stackra/testing@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [1d7bbc1]
- Updated dependencies [dc9da69]
- Updated dependencies [8f8ddcf]
- Updated dependencies [3942ab1]
  - @stackra/database@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/console@0.25.0
  - @stackra/testing@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
- Updated dependencies [2df7162]
  - @stackra/actions@0.24.0
  - @stackra/database@0.24.0
  - @stackra/console@0.24.0
  - @stackra/testing@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [6edeee4]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
  - @stackra/database@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/console@0.23.0
  - @stackra/testing@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [b394912]
- Updated dependencies [786848c]
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/console@0.22.0
  - @stackra/testing@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/database@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/console@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/testing@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [80d121b]
- Updated dependencies [a7b7e58]
- Updated dependencies [19a9222]
- Updated dependencies [667a3b5]
  - @stackra/actions@0.20.0
  - @stackra/database@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/console@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/testing@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- 58e3066: `actingScopeId(actor)` and `claimedScopeIds(actor)` move to `@stackra/contracts`: the one answer to which tenant a call acts
  in (an agent's own `scopeId`, else the tenant of the human it acts for; any other actor's own `scopeId`). Every place
  that read `actor.scopeId` as the call's tenant now reads it: the pipeline's `CallDescriptor.scopeId` and `ctx.scopeId`
  (so rate limits, meters, idempotency, query cache keys, approvals and audit entries follow), the queue's job actor and
  unique key, IAM's node lookup, the automation principal check, the access-log outbox sink's `scopeId` stamp, and
  `PostgresAuditTrailDriver`, which now records an agent with no tenant of its own in its human's tenant instead of
  skipping it. A platform agent and every other actor kind are unchanged.
- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [b59aa22]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
- Updated dependencies [12f25aa]
- Updated dependencies [e5f5432]
- Updated dependencies [40fda23]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [dd9427a]
- Updated dependencies [4a23af8]
- Updated dependencies [fc845f4]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
- Updated dependencies [d2b3d22]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/database@0.19.0
  - @stackra/config@0.19.0
  - @stackra/console@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/testing@0.19.0

## 0.18.1

### Patch Changes

- @stackra/actions@0.18.1
  - @stackra/database@0.18.1
  - @stackra/console@0.18.1
  - @stackra/testing@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- @stackra/actions@0.18.0
  - @stackra/database@0.18.0
  - @stackra/console@0.18.0
  - @stackra/testing@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- @stackra/actions@0.17.2
  - @stackra/database@0.17.2
  - @stackra/console@0.17.2
  - @stackra/testing@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- @stackra/actions@0.17.1
  - @stackra/database@0.17.1
  - @stackra/console@0.17.1
  - @stackra/testing@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/database@0.17.0
  - @stackra/console@0.17.0
  - @stackra/testing@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/validation@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/database@0.16.0
  - @stackra/console@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/testing@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/actions@0.15.0
  - @stackra/database@0.15.0
  - @stackra/console@0.15.0
  - @stackra/testing@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/actions@0.14.4
  - @stackra/database@0.14.4
  - @stackra/console@0.14.4
  - @stackra/testing@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/database@0.14.3
  - @stackra/console@0.14.3
  - @stackra/testing@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/validation@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/database@0.14.2
  - @stackra/console@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/testing@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/database@0.14.1
  - @stackra/console@0.14.1
  - @stackra/testing@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/validation@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/database@0.14.0
  - @stackra/console@0.14.0
  - @stackra/testing@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/validation@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/database@0.13.0
  - @stackra/console@0.13.0
  - @stackra/testing@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/validation@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/database@0.12.0
  - @stackra/console@0.12.0
  - @stackra/testing@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/validation@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/database@0.11.1
  - @stackra/console@0.11.1
  - @stackra/testing@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/validation@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/database@0.11.0
  - @stackra/console@0.11.0
  - @stackra/testing@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/validation@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/console@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/testing@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [be4a198]
- Updated dependencies [9bb5d55]
- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [f9c825d]
  - @stackra/console@0.9.0
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/database@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/testing@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/console@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/testing@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/actions@0.7.1
  - @stackra/database@0.7.1
  - @stackra/console@0.7.1
  - @stackra/testing@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Patch Changes

- @stackra/actions@0.7.0
  - @stackra/database@0.7.0
  - @stackra/console@0.7.0
  - @stackra/testing@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/database@0.6.1
  - @stackra/console@0.6.1
  - @stackra/testing@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/validation@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [2256bf6]
- Updated dependencies [1677615]
- Updated dependencies [1677615]
- Updated dependencies [fb29d41]
- Updated dependencies [4fcb66d]
  - @stackra/console@0.6.0
  - @stackra/database@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/testing@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/console@0.5.1
  - @stackra/testing@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/actions@0.5.0
  - @stackra/database@0.5.0
  - @stackra/console@0.5.0
  - @stackra/testing@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Minor Changes

- 9c8d108: Packages contribute console commands, and gen collects them per member (STA-1731). `@stackra/console` audits a
  command declared `audit: true` through the `CommandAudit` port (refused before it runs when no sink is ready; secret
  values redacted). gen records commands in the manifest, merges hosted packages' commands, refuses
  `command_collision`, and writes `#stackra/commands` and a console entry that `stackra console <member>` runs. First
  commands: `db:migrate`, `db:rollback`, `db:status`, `db:seed`, `tenant:list`, `tenant:create` (with a
  `TenantDirectory` port), `cache:clear` (the `Cache` port gains `flush`), `queue:work`, `queue:failed` and
  `queue:retry`; `@stackra/access-log` stores command audit entries (`STACKRA_COMMAND_AUDIT_SCOPE`).

### Patch Changes

- b970c98: `QueueService.push`, `chain` and `batch` refuse a `scope` that is not shaped like a platform `ScopeRef` with the new
  `ScopeNotPlatformWrittenError` (`scope_not_platform_written`), and `QueueWorkerService` dead-letters a scoped job at once
  with the new `JobIsolationMissingError` (`job_isolation_missing`) when no `CallIsolation` is bound, instead of running it
  in a scope session that set no tenant (STA-1823, ADR 0495 note of 2026-11-01).
- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [ef987d9]
- Updated dependencies [a8c358a]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [4f3f1ed]
- Updated dependencies [e070131]
- Updated dependencies [d675b4d]
- Updated dependencies [3df2c07]
- Updated dependencies [2d6bb63]
- Updated dependencies [7dc74f6]
- Updated dependencies [d9bf3c2]
- Updated dependencies [90f55b1]
- Updated dependencies [1c22c33]
- Updated dependencies [688cf0c]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [5fc0db7]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/console@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/container@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/testing@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- a60f4e9: The worker runs a job and its `onDeadLetter` hook through the bound `CallIsolation` as the job's stored actor in its
  scope (STA-1699, ADR 0495), and no longer wraps an attempt in a scope session of its own when one is bound; with none
  bound it runs in `Database.withScope` as before.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/testing@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 4ca7b80: Add the `BrokerPublisher` port with its memory, generated-topic (`registerBrokerTopics`) and Valkey-stream drivers, and
  `BrokerConfig` (key `queue.broker`).
- 6d0152d: Add the `broker` queue driver (`BrokerQueueDriver`, `./node`): jobs are published to the `queue.<queue>` Pub/Sub topics
  gen's `emitEncoreQueues` emits and run when the generated subscription calls `QueueWorkerService.process`. A retry is
  published again with its `runAt`; a job delivered early is refused with the new `JobNotDueError` (`job_not_due`) so the
  broker redelivers it; dead letters stay in `queue.jobs` for `deadLetters` and `redrive`. `QueueDriver` gains a concrete
  `claim(job, now)` (the default answers the job as it is), which `process` now calls before it runs a job.
- 1e26ab8: Fair queues (ADR 0148 d2): a reservation takes the highest `priority`, then the scope with the fewest running jobs,
  never past a job's `scopeConcurrency`; `job.throttle` takes a token from the `RateLimitStore` before each attempt
  (`JobOutcome.Throttled`); `QueueService.chain`, `batch` and `progress`; `QueueDriver.release`, `openBatch`,
  `settleBatch` and `batch`; migration `queue.0002_add_job_fairness` with `queue.job_batches`; and the
  `runQueueConformance` suite every driver passes.
- d72a734: Add `QueueHealthIndicatorDriver`, the `HealthIndicator` named `queue` that lists one dead letter, and the `health` field of `QueueConfig` (probe timeout `PT2S`, `critical`) (STA-1379).
- 2787c1e: Add `@stackra/queue`: the runtime of an action's `job:` option, with `QueueService` (push, dead letters, redrive), the
  `QueueWorkerService` that runs each attempt through the action pipeline with a timeout, backoff retries, a dead-letter
  queue and the `onDeadLetter` hook, the `QueueDriver` port with memory and Postgres (`SKIP LOCKED`) drivers, the
  `JobDispatcher` driver behind `ctx.dispatch` (the job keeps the caller's scope), `Backoff`, `queues()`, `QueueConfig`, and the `drainQueue` and `runJob`
  test helpers.
- 150fa18: `Backoff` moves to @stackra/contracts and is re-exported here. `backoffDelay` is removed: use the contracts
  `backoffDelay({ ...JOB_BACKOFF, backoff }, attempt)`; `JOB_BACKOFF` keeps the old 10 s base, half-again jitter and
  one-hour cap. (stackra-223)

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- f04fec9: Make every declaration emit self-contained (TS2883, STA-1220): explicit types on `TierMultiplierExtension`'s base,
  `Dropdown`, the observability stack functions, `JOB_TYPES` and `SCHEDULED_JOBS`, and the type `PassBase` exported from
  `@stackra/integrations` so a consumer's `extends Pass({ key })` class can be declared.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [bc4acfc]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [94ae85f]
- Updated dependencies [dddbbcd]
- Updated dependencies [856995c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [ca85d59]
- Updated dependencies [d72a734]
- Updated dependencies [9841d79]
- Updated dependencies [f6d1a76]
- Updated dependencies [c196bc6]
- Updated dependencies [49ab0e6]
- Updated dependencies [d156aa8]
- Updated dependencies [6d46e5e]
- Updated dependencies [2787c1e]
- Updated dependencies [38a5501]
- Updated dependencies [e0f2fc8]
- Updated dependencies [62c7ae1]
- Updated dependencies [c868bad]
- Updated dependencies [0d36f0d]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [da8bdbd]
- Updated dependencies [763e901]
- Updated dependencies [936fcb1]
- Updated dependencies [f11cbe8]
- Updated dependencies [f7a2d36]
- Updated dependencies [483eb44]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [d5e5ff8]
- Updated dependencies [b62c042]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [0a20a9f]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [a31d463]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
- Updated dependencies [ab9cc36]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
