# @stackra/scheduler

## 0.33.0

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [6186329]
- Updated dependencies [93d63bb]
- Updated dependencies [0a57fb3]
- Updated dependencies [3c47a3a]
- Updated dependencies [2e3e323]
- Updated dependencies [93d63bb]
- Updated dependencies [54aa1e7]
- Updated dependencies [4bf092e]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [41a5ff0]
- Updated dependencies [41a5ff0]
- Updated dependencies [246594d]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/actions@0.33.0
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/gen@0.33.0
  - @stackra/queue@0.33.0
  - @stackra/testing@0.33.0
  - @stackra/database@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/locking@0.33.0
  - @stackra/container@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
- Updated dependencies [597e3e8]
  - @stackra/config@0.32.0
  - @stackra/gen@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/database@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/locking@0.32.0
  - @stackra/queue@0.32.0
  - @stackra/testing@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
- Updated dependencies [73ea174]
- Updated dependencies [137a7f9]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/gen@0.31.0
  - @stackra/queue@0.31.0
  - @stackra/locking@0.31.0
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
- Updated dependencies [04d04e4]
- Updated dependencies [0bf0a7f]
- Updated dependencies [0394e56]
- Updated dependencies [d8d78f0]
- Updated dependencies [7b5a381]
- Updated dependencies [7d60f82]
- Updated dependencies [0394e56]
- Updated dependencies [418e195]
- Updated dependencies [e1e95d1]
- Updated dependencies [5b064da]
- Updated dependencies [dab9009]
- Updated dependencies [e1e1b5e]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [98a8940]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [cd2496b]
- Updated dependencies [d5a7d0a]
- Updated dependencies [15dba8d]
  - @stackra/actions@0.30.0
  - @stackra/gen@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/database@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/queue@0.30.0
  - @stackra/container@0.30.0
  - @stackra/config@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/locking@0.30.0
  - @stackra/testing@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [f069f95]
- Updated dependencies [edc2781]
- Updated dependencies [b26036e]
- Updated dependencies [8ad5f87]
- Updated dependencies [11a19a7]
- Updated dependencies [75ec6eb]
- Updated dependencies [1b727b9]
- Updated dependencies [45afd22]
- Updated dependencies [25b99da]
  - @stackra/actions@0.29.0
  - @stackra/gen@0.29.0
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/queue@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/locking@0.29.0
  - @stackra/testing@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [f0be8d8]
- Updated dependencies [7a87018]
- Updated dependencies [2b6f88c]
  - @stackra/gen@0.28.0
  - @stackra/actions@0.28.0
  - @stackra/database@0.28.0
  - @stackra/queue@0.28.0
  - @stackra/locking@0.28.0
  - @stackra/testing@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [4a4d817]
- Updated dependencies [fb1ae38]
  - @stackra/database@0.27.0
  - @stackra/gen@0.27.0
  - @stackra/locking@0.27.0
  - @stackra/queue@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/testing@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [93e358e]
- Updated dependencies [ec00fd8]
- Updated dependencies [081989b]
- Updated dependencies [b1603a7]
- Updated dependencies [5c0aafc]
- Updated dependencies [9b02a7c]
- Updated dependencies [9cee75d]
- Updated dependencies [a9f21b6]
  - @stackra/database@0.26.0
  - @stackra/gen@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/locking@0.26.0
  - @stackra/queue@0.26.0
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
- Updated dependencies [689c37b]
- Updated dependencies [8a8fa6f]
- Updated dependencies [8f8ddcf]
- Updated dependencies [3942ab1]
  - @stackra/database@0.25.0
  - @stackra/gen@0.25.0
  - @stackra/locking@0.25.0
  - @stackra/queue@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/testing@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [b4c2501]
- Updated dependencies [f86dec4]
- Updated dependencies [2df7162]
  - @stackra/actions@0.24.0
  - @stackra/gen@0.24.0
  - @stackra/database@0.24.0
  - @stackra/queue@0.24.0
  - @stackra/locking@0.24.0
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
- Updated dependencies [7ff4969]
- Updated dependencies [926faa4]
- Updated dependencies [96374f4]
- Updated dependencies [557809c]
- Updated dependencies [c26fb86]
- Updated dependencies [8b42c02]
- Updated dependencies [1083617]
- Updated dependencies [6edeee4]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
- Updated dependencies [f790fa1]
- Updated dependencies [fb6e2b3]
  - @stackra/database@0.23.0
  - @stackra/gen@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/locking@0.23.0
  - @stackra/queue@0.23.0
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
- Updated dependencies [e41d9a1]
- Updated dependencies [4663a61]
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/gen@0.22.0
  - @stackra/locking@0.22.0
  - @stackra/queue@0.22.0
  - @stackra/testing@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [2974e54]
- Updated dependencies [ae9cb23]
- Updated dependencies [d25a7a0]
- Updated dependencies [9feea9d]
- Updated dependencies [00a2477]
- Updated dependencies [a785356]
- Updated dependencies [f184d12]
- Updated dependencies [4242bbb]
  - @stackra/gen@0.21.0
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/database@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/locking@0.21.0
  - @stackra/queue@0.21.0
  - @stackra/testing@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [6623da1]
- Updated dependencies [667a3b5]
- Updated dependencies [80d121b]
- Updated dependencies [a7b7e58]
- Updated dependencies [19a9222]
- Updated dependencies [667a3b5]
  - @stackra/actions@0.20.0
  - @stackra/gen@0.20.0
  - @stackra/database@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/queue@0.20.0
  - @stackra/locking@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/testing@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [b59aa22]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
- Updated dependencies [12f25aa]
- Updated dependencies [e5f5432]
- Updated dependencies [40fda23]
- Updated dependencies [ee00741]
- Updated dependencies [5830168]
- Updated dependencies [ef04935]
- Updated dependencies [1cc3bd3]
- Updated dependencies [afd7846]
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
  - @stackra/queue@0.19.0
  - @stackra/gen@0.19.0
  - @stackra/database@0.19.0
  - @stackra/config@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/locking@0.19.0
  - @stackra/testing@0.19.0

## 0.18.1

### Patch Changes

- Updated dependencies [2a7bc6d]
  - @stackra/gen@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/database@0.18.1
  - @stackra/testing@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/locking@0.18.1
  - @stackra/queue@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [79dcafb]
  - @stackra/gen@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/database@0.18.0
  - @stackra/testing@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/locking@0.18.0
  - @stackra/queue@0.18.0

## 0.17.2

### Patch Changes

- Updated dependencies [2da4d9d]
  - @stackra/gen@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/database@0.17.2
  - @stackra/testing@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/locking@0.17.2
  - @stackra/queue@0.17.2

## 0.17.1

### Patch Changes

- @stackra/actions@0.17.1
  - @stackra/database@0.17.1
  - @stackra/gen@0.17.1
  - @stackra/testing@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/locking@0.17.1
  - @stackra/queue@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/database@0.17.0
  - @stackra/gen@0.17.0
  - @stackra/testing@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/locking@0.17.0
  - @stackra/queue@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [6ed8ab1]
- Updated dependencies [c6e4715]
- Updated dependencies [64cfc1d]
- Updated dependencies [5bf8ad3]
  - @stackra/gen@0.16.0
  - @stackra/validation@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/database@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/locking@0.16.0
  - @stackra/queue@0.16.0
  - @stackra/testing@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/actions@0.15.0
  - @stackra/database@0.15.0
  - @stackra/gen@0.15.0
  - @stackra/testing@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/locking@0.15.0
  - @stackra/queue@0.15.0

## 0.14.4

### Patch Changes

- @stackra/actions@0.14.4
  - @stackra/database@0.14.4
  - @stackra/gen@0.14.4
  - @stackra/testing@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/locking@0.14.4
  - @stackra/queue@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/database@0.14.3
  - @stackra/gen@0.14.3
  - @stackra/testing@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/locking@0.14.3
  - @stackra/queue@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/database@0.14.2
  - @stackra/gen@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/locking@0.14.2
  - @stackra/queue@0.14.2
  - @stackra/testing@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/database@0.14.1
  - @stackra/gen@0.14.1
  - @stackra/testing@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/locking@0.14.1
  - @stackra/queue@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/database@0.14.0
  - @stackra/gen@0.14.0
  - @stackra/testing@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/locking@0.14.0
  - @stackra/queue@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/database@0.13.0
  - @stackra/gen@0.13.0
  - @stackra/testing@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/locking@0.13.0
  - @stackra/queue@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/database@0.12.0
  - @stackra/gen@0.12.0
  - @stackra/testing@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/locking@0.12.0
  - @stackra/queue@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/database@0.11.1
  - @stackra/gen@0.11.1
  - @stackra/testing@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/locking@0.11.1
  - @stackra/queue@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/database@0.11.0
  - @stackra/gen@0.11.0
  - @stackra/testing@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/locking@0.11.0
  - @stackra/queue@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [05da3d4]
- Updated dependencies [242ebe4]
- Updated dependencies [aea9b1d]
  - @stackra/gen@0.10.0
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/locking@0.10.0
  - @stackra/queue@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/testing@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [b210fc8]
- Updated dependencies [3db6529]
- Updated dependencies [e80a99b]
- Updated dependencies [c19ca9c]
- Updated dependencies [2e43c48]
- Updated dependencies [c00ae11]
- Updated dependencies [502cba1]
- Updated dependencies [94354cc]
- Updated dependencies [dbe1e9d]
- Updated dependencies [b174a17]
- Updated dependencies [2ae4f65]
- Updated dependencies [f9c825d]
  - @stackra/gen@0.9.0
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/database@0.9.0
  - @stackra/queue@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/locking@0.9.0
  - @stackra/testing@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/gen@0.8.0
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/locking@0.8.0
  - @stackra/queue@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/testing@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- Updated dependencies [448c52f]
  - @stackra/gen@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/database@0.7.1
  - @stackra/testing@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/locking@0.7.1
  - @stackra/queue@0.7.1

## 0.7.0

### Patch Changes

- @stackra/actions@0.7.0
  - @stackra/database@0.7.0
  - @stackra/gen@0.7.0
  - @stackra/testing@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/locking@0.7.0
  - @stackra/queue@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/database@0.6.1
  - @stackra/gen@0.6.1
  - @stackra/testing@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/locking@0.6.1
  - @stackra/queue@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
- Updated dependencies [f0478cd]
- Updated dependencies [0090b9c]
- Updated dependencies [b98f7ea]
- Updated dependencies [71bbf08]
- Updated dependencies [99750d4]
- Updated dependencies [e15d9c3]
- Updated dependencies [e250d4f]
  - @stackra/database@0.6.0
  - @stackra/gen@0.6.0
  - @stackra/queue@0.6.0
  - @stackra/locking@0.6.0
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
  - @stackra/locking@0.5.1
  - @stackra/queue@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/gen@0.5.1
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
  - @stackra/gen@0.5.0
  - @stackra/testing@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/locking@0.5.0
  - @stackra/queue@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
- Updated dependencies [3ce01cf]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
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
- Updated dependencies [c9cf778]
- Updated dependencies [b99d4af]
- Updated dependencies [b531c97]
- Updated dependencies [0cf32d7]
- Updated dependencies [457b107]
- Updated dependencies [4561f10]
- Updated dependencies [823d985]
- Updated dependencies [d675b4d]
- Updated dependencies [ca7d004]
- Updated dependencies [1856ee0]
- Updated dependencies [d0b1ef3]
- Updated dependencies [3400ff6]
- Updated dependencies [13b7dff]
- Updated dependencies [aa21e6b]
- Updated dependencies [dbb60dc]
- Updated dependencies [bb08f25]
- Updated dependencies [5f63e58]
- Updated dependencies [5fc0db7]
- Updated dependencies [b970c98]
  - @stackra/actions@0.4.0
  - @stackra/gen@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/queue@0.4.0
  - @stackra/container@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/locking@0.4.0
  - @stackra/testing@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- f05c8e5: A job the scheduler pushes in a scope now carries the scheduler's actor (`sys_scheduler`, a system actor) acting in that
  scope as its `origin` (STA-1699, ADR 0495), so the queue worker runs it through `CallIsolation` bound to the scope; a
  platform run carries none, and a platform cron over tenants stays one job per scope.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
- Updated dependencies [d0569d2]
- Updated dependencies [4bdb23b]
- Updated dependencies [ccc0b0f]
- Updated dependencies [d05f876]
- Updated dependencies [c9296d9]
- Updated dependencies [8dead7a]
- Updated dependencies [499effb]
- Updated dependencies [a60f4e9]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/gen@0.3.0
  - @stackra/locking@0.3.0
  - @stackra/queue@0.3.0
  - @stackra/testing@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [9a2a6b0]
- Updated dependencies [bab9fe1]
- Updated dependencies [1a9259b]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/gen@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/queue@0.2.0
  - @stackra/locking@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- fbaaba0: Add the Encore CronJob driver: `encoreCronJobs()` declares one CronJob per cron action and a minute CronJob for the
  stored schedules, `SchedulerService.fire(key)` pushes one cron action's run, and `tick(at, { crons: false })` leaves
  the crons of actions to their CronJobs.
- 2787c1e: Add `@stackra/scheduler`: cron dispatch of job actions (`job: { cron }`, once for the platform or, with `perScope`,
  once per scope) and
  per-scope schedules kept as data with a time zone and a misfire policy, ticked once a minute on one runner with
  bounded catch-up, pushed through `@stackra/queue`, with the memory and Postgres schedule drivers and the `tick` test
  helper.

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
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 22ffbbf: `encoreCronJobs()` names each CronJob with gen's `cronJobId`, the one formula gen also emits with (STA-768).
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
- Updated dependencies [854d7a9]
- Updated dependencies [0abe92d]
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
- Updated dependencies [37e1aa8]
- Updated dependencies [483eb44]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [cc8db5e]
- Updated dependencies [bbec10c]
- Updated dependencies [c857043]
- Updated dependencies [0a38324]
- Updated dependencies [9fa326c]
- Updated dependencies [3840889]
- Updated dependencies [3730669]
- Updated dependencies [fb11778]
- Updated dependencies [f55eced]
- Updated dependencies [9c799c4]
- Updated dependencies [165fae0]
- Updated dependencies [957fe36]
- Updated dependencies [cda22dd]
- Updated dependencies [a45aec8]
- Updated dependencies [727e5f7]
- Updated dependencies [783fb5b]
- Updated dependencies [401d703]
- Updated dependencies [a3611b4]
- Updated dependencies [2562581]
- Updated dependencies [cac7c42]
- Updated dependencies [d5b457f]
- Updated dependencies [2c78113]
- Updated dependencies [2787c1e]
- Updated dependencies [ca33793]
- Updated dependencies [c868bad]
- Updated dependencies [640ae17]
- Updated dependencies [7cbd46d]
- Updated dependencies [0f3325f]
- Updated dependencies [d7c5bf2]
- Updated dependencies [8c52f12]
- Updated dependencies [4f92d09]
- Updated dependencies [1ab0f73]
- Updated dependencies [2c05f14]
- Updated dependencies [780b049]
- Updated dependencies [a78c614]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [2787c1e]
- Updated dependencies [484dc58]
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
- Updated dependencies [8b38906]
- Updated dependencies [1b4effa]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [4ca7b80]
- Updated dependencies [6d0152d]
- Updated dependencies [1e26ab8]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [ae9621e]
- Updated dependencies [a32b62d]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [a31d463]
- Updated dependencies [3649655]
- Updated dependencies [62a97c0]
- Updated dependencies [c526bed]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [fa41d2d]
- Updated dependencies [e756399]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
- Updated dependencies [ab9cc36]
- Updated dependencies [f04fec9]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/gen@0.1.0
  - @stackra/locking@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/queue@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
