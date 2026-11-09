# @stackra/workflow

## 0.32.0

### Patch Changes

- 918c766: `NativeWorkflowRunnerDriver#view` now awaits a workflow's async `output()`. Before this, `workflow.run.get@1` showed `{}` for a workflow whose output is computed asynchronously. An async output that rejects falls back to `null`, as a synchronous throw already did.
- Updated dependencies [9ddce28]
  - @stackra/config@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/database@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/locking@0.32.0
  - @stackra/queue@0.32.0
  - @stackra/tenancy@0.32.0
  - @stackra/iam@0.32.0
  - @stackra/rules@0.32.0
  - @stackra/content@0.32.0
  - @stackra/model@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Minor Changes

- 137a7f9: Every automation run a trigger or a schedule starts is now checked against the new `AutomationQuota` port, which `AutomationService` injects, so a host that runs automations must select a driver. Over the quota, the run is skipped and `AutomationRunSkipped` (`quota_exceeded`) is recorded; that is not a failure. A quota that cannot be read starts nothing and records `quota_unavailable` (fail closed); `triggered` never throws for a quota. `AutomationService.triggered(block, startedBy)` takes an `AutomationStart`, kept on the skip. Gen's platform binding of `AutomationService` gains the port.
  
  Release order: this core release first; then Figentra Billing publishes its usage client package with the driver (`credits.quota.check@1` on `automation.runs`, called as the host member inside the automation's tenant); then os bumps and selects that driver in the same pull request. No host takes `UnlimitedAutomationQuotaDriver` as a stopgap: it is only for a host that sells no automation quota.

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/rules@0.31.0
  - @stackra/content@0.31.0
  - @stackra/queue@0.31.0
  - @stackra/iam@0.31.0
  - @stackra/tenancy@0.31.0
  - @stackra/locking@0.31.0
  - @stackra/model@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/events@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

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
- Updated dependencies [a426842]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [98a8940]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [d5a7d0a]
- Updated dependencies [15dba8d]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/iam@0.30.0
  - @stackra/database@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/queue@0.30.0
  - @stackra/container@0.30.0
  - @stackra/tenancy@0.30.0
  - @stackra/rules@0.30.0
  - @stackra/content@0.30.0
  - @stackra/model@0.30.0
  - @stackra/config@0.30.0
  - @stackra/events@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/locking@0.30.0

## 0.29.0

### Minor Changes

- 9eb3427: The workflow engine's journal is tenant-owned in the platform form (migration `workflow.0012_contract_journal_tenancy`):
  `runs`, `steps` and `signals` get a nullable `tenant_id`, filled from `app.tenant_id` by default (a NULL row is the
  platform's), forced row-level security and the platform policies. The worker's tick claims due runs and lapsed signals
  across tenants through the system functions `workflow.claim_due_runs` and `workflow.claim_expired_signals` (ids,
  owners and order only), then loads, advances or removes each in its owner's isolation. A run is owned by the tenant of
  the call that started it, and every save runs in that owner. A claimed run that does not load, or an owned row with no
  `CallIsolation` bound, fails the tick (`ClaimNotLoadedError`, `RowIsolationMissingError` from `@stackra/outbox`); a
  claimed row is never skipped. A system or job origin that names no tenant, started in a tenant's session (an event's
  run), takes that tenant for its steps; an actor that names a scope, a user and an agent are never rewritten.
  
  A signal is held under the tenant it is sent or delivered in, and a run takes only signals of its own tenant: a run
  that waits for acks (such as a provisioning run waiting for `AllServicesAcked`) must start in the tenant the acks are
  sent in, never as a platform run. `workflow.run.get` keeps its own check, and another tenant's run is now also hidden by row
  security, with the same `run_not_found`.
  
  Upgrade: finish or cancel the workflows running below a tenant node before you migrate. The migration backfills a run at
  a tenant node (`nlevel(scope_path) = 3`) from its scope and keeps a run with no scope, at the root or at a product node,
  as a platform run; a step takes its run's tenant, and a held signal the tenant of the waiting run that awaits it (else
  its own scope's, by the same rule). It refuses, changing nothing, while a run or a held signal sits below a tenant node,
  naming each count and the remedy: finish or cancel those runs and delete them (their steps go with them); let the
  waiting runs take those signals, or delete them.
  
  Breaking port changes, for a custom `WorkflowJournal` driver:
  
  - `due` returns `RunClaim` (id, `ownerId`, `startedAt`) instead of ids; the engine loads each with `find` in its owner.
  - `expire` is gone: `expired(now, limit)` claims lapsed signals (`SignalClaim`: id, `ownerId`) and `remove(ids)` deletes
    them in the session's owner.
  - New `currentOwner()`: the tenant of the caller's session. `WorkflowRun` gains `ownerId`, which the journal reads back
    and never writes.

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [11a19a7]
- Updated dependencies [45afd22]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/tenancy@0.29.0
  - @stackra/rules@0.29.0
  - @stackra/content@0.29.0
  - @stackra/outbox@0.29.0
  - @stackra/queue@0.29.0
  - @stackra/iam@0.29.0
  - @stackra/model@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/events@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/locking@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/rules@0.28.0
  - @stackra/content@0.28.0
  - @stackra/database@0.28.0
  - @stackra/outbox@0.28.0
  - @stackra/queue@0.28.0
  - @stackra/iam@0.28.0
  - @stackra/tenancy@0.28.0
  - @stackra/locking@0.28.0
  - @stackra/model@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/events@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Minor Changes

- 5119f3c: `workflow.run.get@1`: the person who started a run (or an agent acting for them) and the tenant's services read its
  status, end time and its workflow's output so far, the pull path beside the run's events for a caller whose `ctx.run`
  answered while the run parked. It is L1 (`workflow.run.get`), scoped to the caller's tenant, and answers
  `run_not_found` for any run the caller may not see, so a run's existence never leaks. The engine gains `view(id)`.

### Patch Changes

- Updated dependencies [4a4d817]
- Updated dependencies [8a70552]
  - @stackra/database@0.27.0
  - @stackra/outbox@0.27.0
  - @stackra/rules@0.27.0
  - @stackra/content@0.27.0
  - @stackra/locking@0.27.0
  - @stackra/queue@0.27.0
  - @stackra/iam@0.27.0
  - @stackra/tenancy@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/model@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/events@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Minor Changes

- 0341ef1: A failed step's retry no longer waits out its backoff in process. The run parks like a timed wait (the step waiting
  with its next attempt's time and the failure it keeps), the caller answers at once with the output so far, and the
  worker's tick runs the attempt when it is due. A backoff at or under the new config `workflow.retryInlineMax`
  (default `"0s"`) still waits in process. A step that waits for a signal keeps waiting out its retry in process for now.

### Patch Changes

- Updated dependencies [93e358e]
- Updated dependencies [9b02a7c]
- Updated dependencies [9cee75d]
- Updated dependencies [a9f21b6]
  - @stackra/database@0.26.0
  - @stackra/tenancy@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/rules@0.26.0
  - @stackra/content@0.26.0
  - @stackra/locking@0.26.0
  - @stackra/outbox@0.26.0
  - @stackra/queue@0.26.0
  - @stackra/model@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/events@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Minor Changes

- ec5272e: A step's retry can come from settings: `@Step({ retry: { attempts, base, backoff, live } })`. `base` sets the first
  wait (the queue's 10 s when absent) and `live(workflow)` reads values that replace the declared attempts, first wait
  and curve each time the step fails, so a changed setting applies to the next retry. A bad or failed read keeps the
  declared values.

### Patch Changes

- 1d7bbc1: The contract migrations (database 0007, achievements 0004, rules 0005, segments 0003, content 0006, collaboration
  0004, workflow 0011 and webhooks 0003) now carry a reviewed squawk ignore, with its reason, above each `SET NOT NULL`
  that the migration's pre-flight checked, so a product that hosts them lints clean. The runner hashes a migration
  without its lint lines, so no checksum changes, and nothing runs differently.
  
  New contract steps can set NOT NULL without scanning the table under an exclusive lock:
  `t.belongsToTenant({ contract: true, safeNotNull: true })`, or `t.change(column).notNull({ safe: true })`, adds a
  `NOT VALID` check, then validates it, sets NOT NULL and drops the check in a later step. The released migrations keep
  their form.
- fe19ac7: Workflow migrations 0007 and 0009 carry reviewed squawk ignores, with their reasons, so a product that hosts
  `@stackra/workflow` lints clean. The runner hashes a migration without its lint lines, so their checksums are unchanged.
  Migration 0010's three warnings are already gone from `@stackra/database` 0.22.0 on, which marks setting defaults.
- Updated dependencies [1d7bbc1]
- Updated dependencies [dc9da69]
- Updated dependencies [8f8ddcf]
- Updated dependencies [3942ab1]
  - @stackra/database@0.25.0
  - @stackra/tenancy@0.25.0
  - @stackra/rules@0.25.0
  - @stackra/content@0.25.0
  - @stackra/locking@0.25.0
  - @stackra/outbox@0.25.0
  - @stackra/queue@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/model@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/events@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Minor Changes

- 2df7162: `ConditionField`, `ServiceAckSet` and `ScopeNode` now extend `Model.global(...)`. Their tables hold no tenant data by
  design: a field registry, the service acks a workflow waits for, and the scope tree (read outside its package only
  through the `ScopeTree` port). Gen no longer warns that these models are neither tenant-owned nor global. The
  row-security audit lists their tables as platform tables. Nothing changes at run time.

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
- Updated dependencies [2df7162]
- Updated dependencies [2df7162]
  - @stackra/actions@0.24.0
  - @stackra/database@0.24.0
  - @stackra/rules@0.24.0
  - @stackra/content@0.24.0
  - @stackra/outbox@0.24.0
  - @stackra/queue@0.24.0
  - @stackra/tenancy@0.24.0
  - @stackra/locking@0.24.0
  - @stackra/model@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/events@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Minor Changes

- 12f4836: The tenancy contract step. A new migration in each package (`achievements.0004`, `rules.0005`, `segments.0003`,
  `content.0006`, `collaboration.0004`, `workflow.0011`) makes `tenant_id` NOT NULL on the tables the expand step gave
  it, makes the tenant equality `pol_<table>_tenant_id` each table's one permissive policy, and keeps the scope path only
  as a restrictive policy, which narrows a session inside its tenant and never widens it. The models of those tables now
  carry `BelongsToTenant`, so a row is filled from the running tenant call.
  
  Each migration first counts the rows with no tenant. If any table has one, it refuses before changing anything and
  names each table's count. An environment that wrote rows in the expand step outside a tenant call runs the tenant
  backfill (RUNWAY 4c) first, then migrates again. After this step, these tables are written only inside a tenant call.
  
  `t.belongsToTenant({ contract: true })` is the macro's form for that step: `SET NOT NULL` on the existing column and
  the equality policy. `{ contract: true, nullable: true }` is the platform form's contract step: the column stays
  nullable under the `platform` policy, as search uses it. The packages ship an int test tier (`test:int`) for these migrations.

### Patch Changes

- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [1083617]
- Updated dependencies [6edeee4]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
- Updated dependencies [12f4836]
  - @stackra/database@0.23.0
  - @stackra/tenancy@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/rules@0.23.0
  - @stackra/content@0.23.0
  - @stackra/locking@0.23.0
  - @stackra/outbox@0.23.0
  - @stackra/queue@0.23.0
  - @stackra/model@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/events@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [b394912]
- Updated dependencies [786848c]
- Updated dependencies [acbee14]
- Updated dependencies [227dd7a]
- Updated dependencies [940e198]
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/tenancy@0.22.0
  - @stackra/events@0.22.0
  - @stackra/rules@0.22.0
  - @stackra/content@0.22.0
  - @stackra/locking@0.22.0
  - @stackra/outbox@0.22.0
  - @stackra/queue@0.22.0
  - @stackra/model@0.22.0
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
  - @stackra/model@0.21.0
  - @stackra/database@0.21.0
  - @stackra/tenancy@0.21.0
  - @stackra/rules@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/content@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/events@0.21.0
  - @stackra/locking@0.21.0
  - @stackra/outbox@0.21.0
  - @stackra/queue@0.21.0

## 0.20.0

### Minor Changes

- 6623da1: New `./contracts` entry holding `ServiceAcked`, `KeptRecords` and `KeptRecords$`. A service that only sends the ack
  imports `@stackra/workflow/contracts` and gen hosts none of the workflow engine in it; the wire name stays
  `workflow.service.acked.v1`. `.` still exports the same symbols (STA-2567).

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
  - @stackra/rules@0.20.0
  - @stackra/content@0.20.0
  - @stackra/outbox@0.20.0
  - @stackra/queue@0.20.0
  - @stackra/tenancy@0.20.0
  - @stackra/locking@0.20.0
  - @stackra/model@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/events@0.20.0
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
- d76d1ed: The expand step of tenancy audit gap D: each scope-path table gains a nullable, indexed `tenant_id` that every insert
  fills from `app.tenant_id` (`t.belongsToTenant({ expand: true })`), with no policy change, so no session reads a row
  more or less. Migrations: `achievements.0003_add_tenancy` (`award_kinds`, `awards`), `rules.0004_add_tenancy`
  (`rule_sets`), `segments.0002_add_tenancy` (`segments`, `segment_memberships`), `content.0005_add_tenancy`
  (`custom_fields`, `custom_field_value_sets`, `revisions`), `search.0008_add_tenancy` (`vector_items`, `queries`),
  `collaboration.0003_add_tenancy` (the four comment tables) and `workflow.0010_add_tenancy` (`automations`, `checklists`,
  `checklist_progresses`). Each package now depends on `@stackra/tenancy` for the macro. Older rows stay null until a
  backfill job sets them; the contract step (NOT NULL, the tenant equality as the one permissive policy, the scope path
  restrictive) follows in a later release.
- 6ec440d: Each package's tenancy expand migration now carries the package's name, in its class and its file
  (`AddAchievementsTenancyMigration` in `0003-add-achievements-tenancy.migration.ts`, and so on), so no exported name is
  declared in two packages. The SQL is unchanged. The migration ids change with the file names
  (`achievements.0003_add_achievements_tenancy`); these migrations ship first in this release, so no database has
  applied the old ids.
- 3833180: Migration `workflow.0009_rename_checklist_progress` renames `workflow.checklist_progress` to
  `workflow.checklist_progresses`, the table the `ChecklistProgress` model maps to, so the checklist service's progress
  reads and writes reach a real table. Rows, indexes and the scope policy move with it. A new integration test runs the
  checklist service on Postgres with every workflow migration applied.
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
- Updated dependencies [e5ac3d0]
- Updated dependencies [d76d1ed]
- Updated dependencies [d2b3d22]
- Updated dependencies [eafb209]
- Updated dependencies [d22e767]
- Updated dependencies [e283a31]
- Updated dependencies [27f2b3f]
- Updated dependencies [15d8a1b]
- Updated dependencies [bc5a0ab]
- Updated dependencies [6ec440d]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/queue@0.19.0
  - @stackra/tenancy@0.19.0
  - @stackra/database@0.19.0
  - @stackra/config@0.19.0
  - @stackra/rules@0.19.0
  - @stackra/content@0.19.0
  - @stackra/model@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/events@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/locking@0.19.0
  - @stackra/outbox@0.19.0

## 0.18.1

### Patch Changes

- @stackra/rules@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/content@0.18.1
  - @stackra/database@0.18.1
  - @stackra/model@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/events@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/locking@0.18.1
  - @stackra/outbox@0.18.1
  - @stackra/queue@0.18.1

## 0.18.0

### Patch Changes

- @stackra/rules@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/content@0.18.0
  - @stackra/database@0.18.0
  - @stackra/model@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/events@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/locking@0.18.0
  - @stackra/outbox@0.18.0
  - @stackra/queue@0.18.0

## 0.17.2

### Patch Changes

- @stackra/rules@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/content@0.17.2
  - @stackra/database@0.17.2
  - @stackra/model@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/events@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/locking@0.17.2
  - @stackra/outbox@0.17.2
  - @stackra/queue@0.17.2

## 0.17.1

### Patch Changes

- @stackra/rules@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/content@0.17.1
  - @stackra/database@0.17.1
  - @stackra/model@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/events@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/locking@0.17.1
  - @stackra/outbox@0.17.1
  - @stackra/queue@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/rules@0.17.0
  - @stackra/content@0.17.0
  - @stackra/database@0.17.0
  - @stackra/model@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/events@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/locking@0.17.0
  - @stackra/outbox@0.17.0
  - @stackra/queue@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/rules@0.16.0
  - @stackra/content@0.16.0
  - @stackra/database@0.16.0
  - @stackra/model@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/events@0.16.0
  - @stackra/locking@0.16.0
  - @stackra/outbox@0.16.0
  - @stackra/queue@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [0b0cf51]
  - @stackra/outbox@0.15.0
  - @stackra/rules@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/content@0.15.0
  - @stackra/database@0.15.0
  - @stackra/model@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/events@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/locking@0.15.0
  - @stackra/queue@0.15.0

## 0.14.4

### Patch Changes

- @stackra/rules@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/content@0.14.4
  - @stackra/database@0.14.4
  - @stackra/model@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/events@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/locking@0.14.4
  - @stackra/outbox@0.14.4
  - @stackra/queue@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/rules@0.14.3
  - @stackra/content@0.14.3
  - @stackra/database@0.14.3
  - @stackra/model@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/events@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/locking@0.14.3
  - @stackra/outbox@0.14.3
  - @stackra/queue@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/rules@0.14.2
  - @stackra/content@0.14.2
  - @stackra/database@0.14.2
  - @stackra/model@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/events@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/locking@0.14.2
  - @stackra/outbox@0.14.2
  - @stackra/queue@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/rules@0.14.1
  - @stackra/content@0.14.1
  - @stackra/database@0.14.1
  - @stackra/model@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/events@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/locking@0.14.1
  - @stackra/outbox@0.14.1
  - @stackra/queue@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/rules@0.14.0
  - @stackra/content@0.14.0
  - @stackra/database@0.14.0
  - @stackra/model@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/events@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/locking@0.14.0
  - @stackra/outbox@0.14.0
  - @stackra/queue@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/rules@0.13.0
  - @stackra/content@0.13.0
  - @stackra/database@0.13.0
  - @stackra/model@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/events@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/locking@0.13.0
  - @stackra/outbox@0.13.0
  - @stackra/queue@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/rules@0.12.0
  - @stackra/content@0.12.0
  - @stackra/database@0.12.0
  - @stackra/model@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/events@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/locking@0.12.0
  - @stackra/outbox@0.12.0
  - @stackra/queue@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/rules@0.11.1
  - @stackra/content@0.11.1
  - @stackra/database@0.11.1
  - @stackra/model@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/events@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/locking@0.11.1
  - @stackra/outbox@0.11.1
  - @stackra/queue@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/rules@0.11.0
  - @stackra/content@0.11.0
  - @stackra/database@0.11.0
  - @stackra/model@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/events@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/locking@0.11.0
  - @stackra/outbox@0.11.0
  - @stackra/queue@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/locking@0.10.0
  - @stackra/outbox@0.10.0
  - @stackra/queue@0.10.0
  - @stackra/rules@0.10.0
  - @stackra/content@0.10.0
  - @stackra/model@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [b174a17]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/model@0.9.0
  - @stackra/container@0.9.0
  - @stackra/database@0.9.0
  - @stackra/queue@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/rules@0.9.0
  - @stackra/content@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/events@0.9.0
  - @stackra/locking@0.9.0
  - @stackra/outbox@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/rules@0.8.0
  - @stackra/content@0.8.0
  - @stackra/locking@0.8.0
  - @stackra/outbox@0.8.0
  - @stackra/queue@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/model@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/events@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/rules@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/content@0.7.1
  - @stackra/database@0.7.1
  - @stackra/model@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/events@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/locking@0.7.1
  - @stackra/outbox@0.7.1
  - @stackra/queue@0.7.1

## 0.7.0

### Patch Changes

- @stackra/rules@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/content@0.7.0
  - @stackra/database@0.7.0
  - @stackra/model@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/events@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/locking@0.7.0
  - @stackra/outbox@0.7.0
  - @stackra/queue@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/rules@0.6.1
  - @stackra/content@0.6.1
  - @stackra/database@0.6.1
  - @stackra/model@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/events@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/locking@0.6.1
  - @stackra/outbox@0.6.1
  - @stackra/queue@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
  - @stackra/database@0.6.0
  - @stackra/queue@0.6.0
  - @stackra/rules@0.6.0
  - @stackra/content@0.6.0
  - @stackra/locking@0.6.0
  - @stackra/outbox@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/model@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/events@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/rules@0.5.1
  - @stackra/content@0.5.1
  - @stackra/locking@0.5.1
  - @stackra/outbox@0.5.1
  - @stackra/queue@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/model@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/events@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/rules@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/content@0.5.0
  - @stackra/database@0.5.0
  - @stackra/model@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/events@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/locking@0.5.0
  - @stackra/outbox@0.5.0
  - @stackra/queue@0.5.0

## 0.4.0

### Patch Changes

- 3ce01cf: A package's entity list is a committed generated contract, `src/node/entities.gen.ts`, written by `stackra gen` and kept
  fresh by `stackra gen --check` (ADR 0294 R10 and ADR 0295, amended 2026-11-01, STA-1874). Each package's `./node` now
  ships its `<KEY>_ENTITIES` inlined in the build instead of importing the gitignored `.stackra/gen/entities/` at runtime,
  which failed: the 0.3.0 builds of these packages carry that broken import until this release. `stackra validate`
  expects the re-export from `#node/entities.gen`, and the doc standard skips `*.gen.ts` files.
- 36dbd49: Each package with models of its own exports `<MEMBER>_ENTITIES` from `./node`, which a hosting service's generated
  `registrations.ts` imports to register the package's entities; without it the service failed with TS2305 (STA-1793). `stackra validate --repository` refuses a package with own
  models whose stand-in `./node` barrel misses it.
- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
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
- Updated dependencies [79dc807]
- Updated dependencies [5fc0db7]
- Updated dependencies [36dbd49]
- Updated dependencies [b970c98]
- Updated dependencies [2bbc0e8]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/rules@0.4.0
  - @stackra/content@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/queue@0.4.0
  - @stackra/container@0.4.0
  - @stackra/events@0.4.0
  - @stackra/outbox@0.4.0
  - @stackra/model@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/locking@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- a60f4e9: The native runner runs each step and each undo through the bound `CallIsolation` as the actor stored in the run's
  `origin`, in the run's scope, inside the journal's transaction (STA-1699, ADR 0495). With none bound it runs as before.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
- Updated dependencies [a60f4e9]
- Updated dependencies [a60f4e9]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/content@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/events@0.3.0
  - @stackra/locking@0.3.0
  - @stackra/model@0.3.0
  - @stackra/outbox@0.3.0
  - @stackra/queue@0.3.0
  - @stackra/rules@0.3.0
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
  - @stackra/rules@0.2.0
  - @stackra/content@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/queue@0.2.0
  - @stackra/locking@0.2.0
  - @stackra/model@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 150fa18: `StepRetry` is removed: `@Step({ retry })` takes `Pick<RetryPolicy, "attempts" | "backoff">` from @stackra/contracts;
  the waits are the contracts `backoffDelay` over the queue's `JOB_BACKOFF`, unchanged. (stackra-223)
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- ad2a950: Add automations to `@stackra/workflow`: the building-block registry (`registerBlocks`, `buildingBlocks`), the automation
  document kind (`AutomationDocument$`, `checkAutomation`, `dryRun`), versioned `Automation` records with
  `AutomationService` (draft, dry run, publish as a principal, seed from `WorkflowTemplatePack$` documents; migration
  `workflow.0003`), and `NativeWorkflowRunnerDriver.startDocument`, which runs an automation or an agent's plan as a
  workflow whose steps are action calls. Runs are pinned to the version they started on (`Workflow({ version })`,
  migration `workflow.0002`), and a step may wait for an event as well as a signal.
- fc44266: Add for-each steps and event-chain limits to automations (OS-232). A document step takes `forEach: { items: <ref> }`
  and calls its block once per item (`item` and `item.<path>` references, per-item keys, results in item order); a list
  longer than `workflow.forEachLimit` (1,000 by default) fails with `ForEachItemsInvalidError`, and the dry run reports
  `iterations`. A document step's call id is now its step key, so events its block records name the run as their
  correlation; `NativeWorkflowRunnerDriver.chained` places a triggered run in its event chain (`RunChain`, kept in the
  run's input via `startDocument(…, { chain })`), and the explorer starts nothing past `workflow.maxChainDepth` (3 by
  default) or back into an automation already in the chain.
- 2787c1e: Add `@stackra/workflow`: the `Workflow` and `Signal` kind bases, `@Step`, `Run<W>` and `StepContext`, the native engine
  behind `ctx.run` and `ctx.signal` (steps in their own transactions and the call's scope, retries, signal waits,
  timeouts and compensation) on a Postgres or memory journal, the boot explorer, `WorkflowConfig`, and the in-process test driver.
- 7441e28: Bound automations by their publisher: `AutomationService.publish` takes the publisher and refuses
  `automation_exceeds_publisher` through the new `PublisherAccess` port (`MemoryPublisherAccessDriver` for tests), and a
  published automation whose publisher lost access pauses (`AutomationPaused`, migration `workflow.0004`, `recheck()`).
  Add the cross-service service-acked contract (`ServiceAcked`, `AllServicesAcked`, `ServiceAckService`, migration
  `workflow.0005`), the checklist engine (`ChecklistTemplate$`, `ChecklistCustomization$`, `IndustryProfile$`,
  `checklistView`, `ChecklistService`, completion events, migration `workflow.0006`), the `workflow.signalRetention`
  setting and `runDocument` in `./testing` (STA-773, STA-776, STA-844, ADR 0423, 0424, 0427).
- eb2572b: Add run operations to `@stackra/workflow` (ADR 0152 decision 4). Every run records `WorkflowRunStarted` and
  `WorkflowRunEnded` (domain events on the bound bus) so a host can record and meter runs. A document run keeps the
  automation it runs (`startDocument(…, { automation })`, `WorkflowRun.automation`, migration `workflow.0007`) and
  `WorkflowJournal.byAutomation` lists an automation's runs newest first; the explorer passes the automation for
  triggered runs. `NativeWorkflowRunnerDriver.cancel(runId, reason)` ends a running or waiting run in the new
  `cancelled` status. `AutomationService.pause(automationId, reason)` pauses an automation for a host's reason.
  `WorkflowJournal` gains the abstract `byAutomation`: a custom journal driver must implement it.

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
- ca44233: Breaking renames for unique public names (STA-1383): `@stackra/rules` `Decision` is `RuleDecision` (iam's `Decision`
  is the allow or deny enum) and `Facts` is `RuleFacts` (ai's `Facts` is the facts kind base). Importers are updated.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
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
- Updated dependencies [2787c1e]
- Updated dependencies [dd341a0]
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
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [483eb44]
- Updated dependencies [fb93026]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
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
- Updated dependencies [9841d79]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c580aa4]
- Updated dependencies [7e60fa9]
- Updated dependencies [b62c042]
- Updated dependencies [e52a367]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [09080ac]
- Updated dependencies [0a20a9f]
- Updated dependencies [2787c1e]
- Updated dependencies [3d34a5d]
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
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [f7a2d36]
- Updated dependencies [67aa168]
- Updated dependencies [0a96532]
- Updated dependencies [49c3553]
- Updated dependencies [c21a223]
- Updated dependencies [2787c1e]
- Updated dependencies [ca44233]
- Updated dependencies [a31d463]
- Updated dependencies [158f6cf]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [ab9cc36]
- Updated dependencies [f04fec9]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/locking@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/content@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/queue@0.1.0
  - @stackra/validation@0.1.0
  - @stackra/rules@0.1.0

Written by Changesets on release; never edited by hand.
