# @stackra/data-maintenance

## 0.33.0

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [03da426]
- Updated dependencies [246594d]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/actions@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/iam@0.33.0
  - @stackra/queue@0.33.0
  - @stackra/tenancy@0.33.0
  - @stackra/model@0.33.0
  - @stackra/database@0.33.0
  - @stackra/search@0.33.0
  - @stackra/outbox@0.33.0
  - @stackra/scheduler@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/container@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- @stackra/actions@0.32.0
  - @stackra/database@0.32.0
  - @stackra/search@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/outbox@0.32.0
  - @stackra/queue@0.32.0
  - @stackra/scheduler@0.32.0
  - @stackra/tenancy@0.32.0
  - @stackra/iam@0.32.0
  - @stackra/model@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/search@0.31.0
  - @stackra/outbox@0.31.0
  - @stackra/queue@0.31.0
  - @stackra/scheduler@0.31.0
  - @stackra/iam@0.31.0
  - @stackra/tenancy@0.31.0
  - @stackra/model@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- d5a7d0a: **Breaking route change.** Every action and query route now sits under its API area. Gen prefixes each derived route with `/<area>`: the
  action's or query's `area`, else the service's own `defineService({ area })`, else `app` (`PUT
  /app/orders/:orderId/cancel`). Every manifest action entry records its `area`, so the committed manifests,
  `openapi.json` and the SDKs move to the prefixed paths.
  
  Gen also refuses, in its full pass (STA-340):
  
  - `endpoint_collision`: two calls on one method and path once parameter names are erased (`GET /app/orders/:orderId`
    and `GET /app/orders/:id`). Until now `openapi.json` silently kept only one of them.
  - `endpoint_versioned`: a `v<digits>` path segment (paths stay unversioned; API versions are dates).
  - `endpoint_area_mismatch`: an `endpoint: { method, path }` override outside its area's prefix.
  - `endpoint_method_mismatch`: a query not on `GET`, an action on `GET`, or a transition overridden away from `PUT`.
  - `job_without_system_actor`: a `job` without the `system` or `job` actor.
  - `cron_input_invalid`: a `job.cron.input` property the input schema does not have, a required one it omits, or a
    value of another JSON type.
  - `intent_phrases_missing`: `intent: true` without a non-empty `actions.<key>.intents` list in a base-language
    catalogue.
  
  The routes outside their area move under it: loyalty-kit's five overrides to `/app/loyalty/...`, the award
  verification to `GET /public/awards/verify`, `CONSENT_SNAPSHOT_PATH` to `/public/consent/snapshots`,
  `ANALYTICS_INGEST_PATH` to `/public/analytics/batches`, `DEVICE_ORDER.acknowledgedPath` to
  `/app/devices/acknowledged` and `CLIENT_RESULT_ACTION.path` to `/app/runs/:runId/client-result`. The committed
  `stackra.manifest.json` of every package with a route (access-log, collaboration, data-maintenance, devices, identity,
  media, privacy, segments, tenancy, webhooks and the packages above) records each entry's `area` and its prefixed path.
  
  The identity lock accepts this move once: an endpoint whose new route is exactly `/<its own area>` plus the locked
  path, with the same method, keeps its identity without `@Renamed`. A move to another area, a method change, or a route
  that already started with an area moving again is still refused with `identity_changed`.
  
  What a product does on its bump: run `stackra gen` and commit the regenerated `stackra.manifest.json` and
  `openapi.json` of each member. Nothing else; no `@Renamed`. Clients regenerate from the new manifests, so a caller
  pinned to an old path (none before launch) would need the prefixed one.

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
- Updated dependencies [98a8940]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [98a8940]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [265a3ee]
- Updated dependencies [d5a7d0a]
- Updated dependencies [15dba8d]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/iam@0.30.0
  - @stackra/database@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/outbox@0.30.0
  - @stackra/queue@0.30.0
  - @stackra/scheduler@0.30.0
  - @stackra/container@0.30.0
  - @stackra/search@0.30.0
  - @stackra/tenancy@0.30.0
  - @stackra/model@0.30.0
  - @stackra/validation@0.30.0

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
  - @stackra/tenancy@0.29.0
  - @stackra/search@0.29.0
  - @stackra/outbox@0.29.0
  - @stackra/queue@0.29.0
  - @stackra/scheduler@0.29.0
  - @stackra/iam@0.29.0
  - @stackra/model@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/scheduler@0.28.0
  - @stackra/database@0.28.0
  - @stackra/search@0.28.0
  - @stackra/outbox@0.28.0
  - @stackra/queue@0.28.0
  - @stackra/iam@0.28.0
  - @stackra/tenancy@0.28.0
  - @stackra/model@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Minor Changes

- 8a70552: The outbox tables are tenant-owned in the platform form (migration `outbox.0006_contract_outbox_tenancy`):
  `messages`, `deliveries`, `changes` (every partition, the default included), `replica_changes`,
  `device_sequences` and `offline_cap_uses` get a nullable `tenant_id`, filled from `app.tenant_id` by default (a
  NULL row is the platform's), forced row-level security and the platform policies. Cross-owner readers claim through
  system functions that return ids, owners and order or lease columns only, and load or change each row in its owner.
  
  Upgrade: drain the relay before you migrate. The migration backfills a row at a tenant node (`nlevel(scope_path) =
  3`) from its scope and keeps a row with no scope, at the root or at a product node, as a platform row. It refuses,
  changing nothing, while a message, delivery, change, replica change or device sequence sits below a tenant node,
  naming each count and the remedy: deliver or dead-letter pending messages and deliveries and delete those dead
  letters; let every change consumer pass such changes and delete them (or wait for retention); delete such replica
  changes (their devices fill again); settle and delete such device sequences. Existing `offline_cap_uses` rows have no
  scope and become platform rows.
  
  Platform messages and changes (written with no tenant) carry no personal data: no tenant's erasure can rewrite them.
  
  Breaking port changes, for a custom driver:
  
  - `OutboxDriver`: `due` is `claim` (returns `OutboxClaim`: id, `ownerId`, due time) plus `load(id)`; `pruneDead` is
    `claimDead`, each claim then deleted with `remove` in its owner.
  - `ChangeFeed`: `read` is `claim` (returns `ChangeClaim`: position, `ownerId`) plus `load(positions)`; `maintain` no
    longer deletes the default partition's expired rows: `expired` claims them and `remove` deletes them per owner
    (`maintainChangeLog` does both).
  - `DeliveryDriver`: `lease` and `list` return `DeliveryClaim` (id, `ownerId`, subscriber, state), `list` also takes
    an `id`, and `load(id)` returns the delivery.
  
  New in `@stackra/outbox`: `loadChanges`, `maintainChangeLog`, `boundIsolation`, `ClaimNotLoadedError` (a claimed row
  that does not load in its owner) and `RowIsolationMissingError` (an owned row with no `CallIsolation` bound). Both
  fail the work: a claimed row is never skipped. `pruneOutbox` takes the isolation as its last argument.
  
  `@stackra/data-maintenance`: `PruneOutboxAction` and `MaintainChangeLogAction` inject the `Container` and read the
  `CallIsolation` from it optionally. `@stackra/data-transfer`: `WarehouseChangeSink` takes the `Container` as its fourth
  argument and loads each owner's changes in its owner. An app without tenancy still boots; its platform rows run as
  before.

### Patch Changes

- Updated dependencies [4a4d817]
- Updated dependencies [8a70552]
  - @stackra/database@0.27.0
  - @stackra/outbox@0.27.0
  - @stackra/search@0.27.0
  - @stackra/queue@0.27.0
  - @stackra/scheduler@0.27.0
  - @stackra/iam@0.27.0
  - @stackra/tenancy@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/model@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- 9b02a7c: A host binds the actions and queries of each package module it hosts, as it does that package's services: they are
  the module's surface, so a test or a client can call one by class (`run(EnrollMemberAction, …)`) without a host class
  injecting it. A published package's manifest lists its actions and queries in `services` with their constructor
  tokens, and the host wiring binds each one with them.
- Updated dependencies [93e358e]
- Updated dependencies [9b02a7c]
- Updated dependencies [9cee75d]
- Updated dependencies [a9f21b6]
  - @stackra/database@0.26.0
  - @stackra/tenancy@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/iam@0.26.0
  - @stackra/search@0.26.0
  - @stackra/outbox@0.26.0
  - @stackra/queue@0.26.0
  - @stackra/scheduler@0.26.0
  - @stackra/model@0.26.0
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
  - @stackra/tenancy@0.25.0
  - @stackra/search@0.25.0
  - @stackra/outbox@0.25.0
  - @stackra/queue@0.25.0
  - @stackra/scheduler@0.25.0
  - @stackra/iam@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/model@0.25.0
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
  - @stackra/search@0.24.0
  - @stackra/outbox@0.24.0
  - @stackra/queue@0.24.0
  - @stackra/scheduler@0.24.0
  - @stackra/iam@0.24.0
  - @stackra/tenancy@0.24.0
  - @stackra/model@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [1083617]
- Updated dependencies [6edeee4]
- Updated dependencies [12f4836]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
- Updated dependencies [12f4836]
  - @stackra/database@0.23.0
  - @stackra/tenancy@0.23.0
  - @stackra/search@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/outbox@0.23.0
  - @stackra/queue@0.23.0
  - @stackra/scheduler@0.23.0
  - @stackra/iam@0.23.0
  - @stackra/model@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [b394912]
- Updated dependencies [786848c]
- Updated dependencies [227dd7a]
- Updated dependencies [940e198]
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/tenancy@0.22.0
  - @stackra/search@0.22.0
  - @stackra/outbox@0.22.0
  - @stackra/queue@0.22.0
  - @stackra/scheduler@0.22.0
  - @stackra/iam@0.22.0
  - @stackra/model@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [d3e77e0]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/model@0.21.0
  - @stackra/database@0.21.0
  - @stackra/search@0.21.0
  - @stackra/tenancy@0.21.0
  - @stackra/scheduler@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/outbox@0.21.0
  - @stackra/queue@0.21.0
  - @stackra/iam@0.21.0

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
  - @stackra/search@0.20.0
  - @stackra/outbox@0.20.0
  - @stackra/queue@0.20.0
  - @stackra/scheduler@0.20.0
  - @stackra/iam@0.20.0
  - @stackra/tenancy@0.20.0
  - @stackra/model@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Minor Changes

- 58a8fa5: Every write action's permission is at least L2 (STA-2096, owner decision 2026-11-04). gen refuses an action whose
  permission is L0 or L1 with `action_risk_below_write`. Raised: `collaboration.room.publish`, `media.upload.create`,
  `data_maintenance.synonym.create` and `.update`, `analytics.analytics_batch.ingest`, `consent.consent_snapshot.issue`,
  `identity.passkey.challenge`, `loyalty_kit.loyalty_account.enroll` to L2;
  `segments.segment.recompute` and `privacy.subject.export` to L2 (system); `loyalty_kit.loyalty_account.redeem` and
  `.stamp` to L3 (a points balance); `loyalty_kit.loyalty_account.expire` to L3 (system); `panel.view.share` to L2;
  `identity.passkey.verify` (it mints a session) and `identity.passkey.confirm` (it keeps a new key) to L4;
  `webhooks.webhook_delivery.send` (an external send) and `access_log.access_log_entry.purge` (it deletes for good) to L4
  (system).

### Patch Changes

- 0e0de4f: Gen refuses a misshapen call. `checkCallShape` runs once per action or query in the manifest pass and refuses a query
  whose permission is L2 or above (`query_above_l1`), a query with `preconditions` (`query_precondition`), an action with
  `cache` (`action_cache`), an L3 or L4 action a user can call with no `stepUp` (`step_up_missing`) and a client write,
  an action with an endpoint or a tool, with no written `idempotency` (`idempotency_missing`). Each refusal carries its
  fix. Write `idempotency: Idempotency.Optional` on a client write that is safe to repeat: it is the default the
  pipeline already applies, and it now also sets the tool's `idempotentHint`.
  
  The actions pipeline asks `StepUpCheck` only when the caller is a user. A service, job, system or agent call carries
  no assurance, so an action that both users and services call can declare `stepUp` and its service callers keep
  working; a user call with no `StepUpCheck` bound still fails closed (ADR 0406 as amended).
  
  `identity.operator.bootstrap`, `identity.session.end_user` and `privacy.hold.release` declare
  `stepUp: AssuranceLevel.Aal2`, so a user call to them now needs a bound `StepUpCheck`. The client writes of identity,
  privacy, access-log, loyalty-kit, data-maintenance, media and collaboration that declared no idempotency write
  `Idempotency.Optional`; their manifests gain the `idempotency` entry and `idempotentHint: true`.
- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [b59aa22]
- Updated dependencies [bac874e]
- Updated dependencies [12f25aa]
- Updated dependencies [e5f5432]
- Updated dependencies [40fda23]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [dd9427a]
- Updated dependencies [4a23af8]
- Updated dependencies [fc845f4]
- Updated dependencies [9063bb3]
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
  - @stackra/iam@0.19.0
  - @stackra/tenancy@0.19.0
  - @stackra/database@0.19.0
  - @stackra/search@0.19.0
  - @stackra/model@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/outbox@0.19.0
  - @stackra/scheduler@0.19.0

## 0.18.1

### Patch Changes

- @stackra/scheduler@0.18.1
  - @stackra/tenancy@0.18.1
  - @stackra/iam@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/database@0.18.1
  - @stackra/model@0.18.1
  - @stackra/search@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/outbox@0.18.1
  - @stackra/queue@0.18.1

## 0.18.0

### Patch Changes

- @stackra/scheduler@0.18.0
  - @stackra/tenancy@0.18.0
  - @stackra/iam@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/database@0.18.0
  - @stackra/model@0.18.0
  - @stackra/search@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/outbox@0.18.0
  - @stackra/queue@0.18.0

## 0.17.2

### Patch Changes

- @stackra/scheduler@0.17.2
  - @stackra/tenancy@0.17.2
  - @stackra/iam@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/database@0.17.2
  - @stackra/model@0.17.2
  - @stackra/search@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/outbox@0.17.2
  - @stackra/queue@0.17.2

## 0.17.1

### Patch Changes

- @stackra/iam@0.17.1
  - @stackra/search@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/database@0.17.1
  - @stackra/model@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/outbox@0.17.1
  - @stackra/queue@0.17.1
  - @stackra/scheduler@0.17.1
  - @stackra/tenancy@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/database@0.17.0
  - @stackra/model@0.17.0
  - @stackra/search@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/outbox@0.17.0
  - @stackra/queue@0.17.0
  - @stackra/scheduler@0.17.0
  - @stackra/iam@0.17.0
  - @stackra/tenancy@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/scheduler@0.16.0
  - @stackra/search@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/database@0.16.0
  - @stackra/model@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/outbox@0.16.0
  - @stackra/queue@0.16.0
  - @stackra/iam@0.16.0
  - @stackra/tenancy@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [0b0cf51]
  - @stackra/outbox@0.15.0
  - @stackra/search@0.15.0
  - @stackra/iam@0.15.0
  - @stackra/tenancy@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/database@0.15.0
  - @stackra/model@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/queue@0.15.0
  - @stackra/scheduler@0.15.0

## 0.14.4

### Patch Changes

- @stackra/search@0.14.4
  - @stackra/iam@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/database@0.14.4
  - @stackra/model@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/outbox@0.14.4
  - @stackra/queue@0.14.4
  - @stackra/scheduler@0.14.4
  - @stackra/tenancy@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/database@0.14.3
  - @stackra/model@0.14.3
  - @stackra/search@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/outbox@0.14.3
  - @stackra/queue@0.14.3
  - @stackra/scheduler@0.14.3
  - @stackra/iam@0.14.3
  - @stackra/tenancy@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/database@0.14.2
  - @stackra/model@0.14.2
  - @stackra/search@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/outbox@0.14.2
  - @stackra/queue@0.14.2
  - @stackra/scheduler@0.14.2
  - @stackra/iam@0.14.2
  - @stackra/tenancy@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/database@0.14.1
  - @stackra/model@0.14.1
  - @stackra/search@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/outbox@0.14.1
  - @stackra/queue@0.14.1
  - @stackra/scheduler@0.14.1
  - @stackra/iam@0.14.1
  - @stackra/tenancy@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/database@0.14.0
  - @stackra/model@0.14.0
  - @stackra/search@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/outbox@0.14.0
  - @stackra/queue@0.14.0
  - @stackra/scheduler@0.14.0
  - @stackra/iam@0.14.0
  - @stackra/tenancy@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/database@0.13.0
  - @stackra/model@0.13.0
  - @stackra/search@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/outbox@0.13.0
  - @stackra/queue@0.13.0
  - @stackra/scheduler@0.13.0
  - @stackra/iam@0.13.0
  - @stackra/tenancy@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/database@0.12.0
  - @stackra/model@0.12.0
  - @stackra/search@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/outbox@0.12.0
  - @stackra/queue@0.12.0
  - @stackra/scheduler@0.12.0
  - @stackra/iam@0.12.0
  - @stackra/tenancy@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/database@0.11.1
  - @stackra/model@0.11.1
  - @stackra/search@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/outbox@0.11.1
  - @stackra/queue@0.11.1
  - @stackra/scheduler@0.11.1
  - @stackra/iam@0.11.1
  - @stackra/tenancy@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/database@0.11.0
  - @stackra/model@0.11.0
  - @stackra/search@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/outbox@0.11.0
  - @stackra/queue@0.11.0
  - @stackra/scheduler@0.11.0
  - @stackra/iam@0.11.0
  - @stackra/tenancy@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/scheduler@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/search@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/outbox@0.10.0
  - @stackra/queue@0.10.0
  - @stackra/tenancy@0.10.0
  - @stackra/model@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/iam@0.10.0

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
  - @stackra/scheduler@0.9.0
  - @stackra/database@0.9.0
  - @stackra/queue@0.9.0
  - @stackra/tenancy@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/search@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/outbox@0.9.0
  - @stackra/iam@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/scheduler@0.8.0
  - @stackra/search@0.8.0
  - @stackra/outbox@0.8.0
  - @stackra/queue@0.8.0
  - @stackra/iam@0.8.0
  - @stackra/tenancy@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/model@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/scheduler@0.7.1
  - @stackra/tenancy@0.7.1
  - @stackra/iam@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/database@0.7.1
  - @stackra/model@0.7.1
  - @stackra/search@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/outbox@0.7.1
  - @stackra/queue@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [1f5bf76]
- Updated dependencies [1f5bf76]
  - @stackra/iam@0.7.0
  - @stackra/tenancy@0.7.0
  - @stackra/search@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/database@0.7.0
  - @stackra/model@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/outbox@0.7.0
  - @stackra/queue@0.7.0
  - @stackra/scheduler@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/database@0.6.1
  - @stackra/model@0.6.1
  - @stackra/search@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/outbox@0.6.1
  - @stackra/queue@0.6.1
  - @stackra/scheduler@0.6.1
  - @stackra/iam@0.6.1
  - @stackra/tenancy@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
- Updated dependencies [e250d4f]
- Updated dependencies [c64a55d]
  - @stackra/database@0.6.0
  - @stackra/iam@0.6.0
  - @stackra/tenancy@0.6.0
  - @stackra/queue@0.6.0
  - @stackra/search@0.6.0
  - @stackra/outbox@0.6.0
  - @stackra/scheduler@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/model@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/search@0.5.1
  - @stackra/outbox@0.5.1
  - @stackra/queue@0.5.1
  - @stackra/scheduler@0.5.1
  - @stackra/iam@0.5.1
  - @stackra/tenancy@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/model@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [104d9f4]
  - @stackra/tenancy@0.5.0
  - @stackra/search@0.5.0
  - @stackra/iam@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/database@0.5.0
  - @stackra/model@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/outbox@0.5.0
  - @stackra/queue@0.5.0
  - @stackra/scheduler@0.5.0

## 0.4.0

### Minor Changes

- 934bd70: Add the tenant's search synonyms (STA-1636, ADR 0492 decision 5), moved here from `@stackra/search` to keep search below
  `@stackra/iam`: the `Synonym` model (`data_maintenance.synonyms`, migration 0001, `BelongsToTenant`, forced RLS),
  `SynonymPermissions`, `SynonymService`, the `data_maintenance.synonym.create`, `.update` and `.delete` actions, the
  `data_maintenance.synonym.list` query, and `DatabaseSynonymSourceDriver`, which implements search's `SynonymSource`. Texts
  in `assets/lang` for ar, de, en, es, fr, it and nl. New workspace dependencies: `@stackra/errors`, `@stackra/model` and
  `@stackra/tenancy`.

### Patch Changes

- 3ce01cf: A package's entity list is a committed generated contract, `src/node/entities.gen.ts`, written by `stackra gen` and kept
  fresh by `stackra gen --check` (ADR 0294 R10 and ADR 0295, amended 2026-11-01, STA-1874). Each package's `./node` now
  ships its `<KEY>_ENTITIES` inlined in the build instead of importing the gitignored `.stackra/gen/entities/` at runtime,
  which failed: the 0.3.0 builds of these packages carry that broken import until this release. `stackra validate`
  expects the re-export from `#node/entities.gen`, and the doc standard skips `*.gen.ts` files.
- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
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
- Updated dependencies [bb08f25]
- Updated dependencies [1856ee0]
- Updated dependencies [70e6c17]
- Updated dependencies [5fc0db7]
- Updated dependencies [b970c98]
- Updated dependencies [2bbc0e8]
- Updated dependencies [1856ee0]
- Updated dependencies [dedaa81]
- Updated dependencies [a7eaed4]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/tenancy@0.4.0
  - @stackra/queue@0.4.0
  - @stackra/container@0.4.0
  - @stackra/iam@0.4.0
  - @stackra/outbox@0.4.0
  - @stackra/search@0.4.0
  - @stackra/model@0.4.0
  - @stackra/scheduler@0.4.0
  - @stackra/errors@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
- Updated dependencies [a60f4e9]
- Updated dependencies [a60f4e9]
- Updated dependencies [f05c8e5]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/iam@0.3.0
  - @stackra/outbox@0.3.0
  - @stackra/queue@0.3.0
  - @stackra/scheduler@0.3.0
  - @stackra/search@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [1a9259b]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/iam@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/search@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/queue@0.2.0
  - @stackra/scheduler@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 31b211a: Add `@stackra/data-maintenance`, the add-on above `@stackra/iam` that holds the data layer's system jobs with their
  system-held permissions (ADR 0462 decision 1): `data_maintenance.partition.maintain` and `data_maintenance.record.prune`
  over `@stackra/database`, `data_maintenance.index.reindex` and `data_maintenance.index.reindex_semantic` over
  `@stackra/search` with the `searchReindex` runner, and `data_maintenance.change_log.maintain` and
  `data_maintenance.outbox_message.prune` over `@stackra/outbox`. Their permissions are `PartitionPermissions`,
  `RecordPermissions`, `IndexPermissions`, `ChangeLogPermissions` and `OutboxMessagePermissions`: L4 system for the jobs
  that drop or delete data, L2 system for the reindex jobs. `ReindexSearchInput.version` (and
  `searchReindex({ version })`) runs a versioned rebuild and swap of `@stackra/search`. `data_maintenance.query.record`
  (`RecordSearchQueryAction`, `QueryPermissions.record`, L2 system) writes the search query log, queued by
  `QueuedSearchQueryLogDriver`, the bound `SearchQueryLog` over `@stackra/search`'s abstract
  `PostgresSearchQueryLogDriver`. `data_maintenance.timeseries.rollup` (`RollUpTimeSeriesAction`,
  `TimeseriesPermissions.rollup`, L4 system) keeps the `TimeSeries` rollups of `@stackra/database` through
  `rollUpAllTimeSeries`.

### Patch Changes

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
- Updated dependencies [fb93026]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [67aa168]
- Updated dependencies [82a533d]
- Updated dependencies [2787c1e]
- Updated dependencies [3312ef3]
- Updated dependencies [f0c9f64]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
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
- Updated dependencies [074d3e8]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [ca44233]
- Updated dependencies [fbaaba0]
- Updated dependencies [22ffbbf]
- Updated dependencies [2787c1e]
- Updated dependencies [a31d463]
- Updated dependencies [38bebd1]
- Updated dependencies [cf64395]
- Updated dependencies [158f6cf]
- Updated dependencies [1f34fad]
- Updated dependencies [d72a734]
- Updated dependencies [68ae29e]
- Updated dependencies [20f3fe9]
- Updated dependencies [2787c1e]
- Updated dependencies [3649655]
- Updated dependencies [9811f8d]
- Updated dependencies [be97996]
- Updated dependencies [41035cc]
- Updated dependencies [7055e31]
- Updated dependencies [1e3e28d]
- Updated dependencies [7e60fa9]
- Updated dependencies [d156aa8]
- Updated dependencies [02a7917]
- Updated dependencies [fdf4b94]
- Updated dependencies [3671963]
- Updated dependencies [640ae17]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
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
  - @stackra/outbox@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/search@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/queue@0.1.0
  - @stackra/scheduler@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
