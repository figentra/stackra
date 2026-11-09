# @stackra/privacy

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
- Updated dependencies [918c766]
  - @stackra/config@0.32.0
  - @stackra/workflow@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/database@0.32.0
  - @stackra/filesystem@0.32.0
  - @stackra/search@0.32.0
  - @stackra/outbox@0.32.0
  - @stackra/queue@0.32.0
  - @stackra/scheduler@0.32.0
  - @stackra/iam@0.32.0
  - @stackra/data-transfer@0.32.0
  - @stackra/model@0.32.0
  - @stackra/testing@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
- Updated dependencies [137a7f9]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/workflow@0.31.0
  - @stackra/data-transfer@0.31.0
  - @stackra/search@0.31.0
  - @stackra/outbox@0.31.0
  - @stackra/queue@0.31.0
  - @stackra/scheduler@0.31.0
  - @stackra/iam@0.31.0
  - @stackra/filesystem@0.31.0
  - @stackra/model@0.31.0
  - @stackra/testing@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/events@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- 265a3ee: The search index registry and the privacy tables are tenant-owned in the platform form: a nullable `tenant_id`,
  filled from `app.tenant_id` by default (a NULL row is the platform's), forced row-level security and the platform
  policies. Cross-tenant readers go through audited system functions that return ids, owners and status columns only.
  
  `@stackra/search` (migration `search.0010_contract_search_index_tenancy`): `search.indexes` backfills a row at a tenant
  node (`nlevel(scope_path) = 3`) from its scope and keeps a row with no scope, at the root or at a product node, as a
  platform row. A NULL scope key replaces the `-` of a platform-wide index under the key `(tenant_id, model, scope_key)`
  (NULLs not distinct). `SearchIndexRegistry.list` (`search:status`) reads every tenant's indexes through
  `search.index_statuses`, and `SearchIndexStatus` gains `ownerId`. `begin`, `progress` and `finish` change only the
  call's own row.
  
  Upgrade, search: the migration refuses, changing nothing, while an index registry row sits below a tenant node; delete
  those rows (they hold only a rebuild's state and counts), migrate, then run `search:reindex` in each node's tenant.
  
  `@stackra/privacy` (migration `privacy.0003_contract_privacy_tenancy`): `subject_salts`, `legal_holds` and
  `legal_hold_refusals` copy their `scope_id` partition exactly into `tenant_id` (`-` becomes NULL) and drop its policy;
  no driver or action reads or writes the `-` partition any more. A salt is keyed `(tenant_id, subject)` (NULLs not
  distinct).
  
  Breaking, privacy: `PostgresHoldRegistryDriver` takes the `Container` as its second argument and reads the
  `CallIsolation` from it optionally. In a system run (no tenant, as `maintainPartitions` runs) it claims the live holds
  of every tenant through `privacy.claim_live_holds`, then checks and logs each owner's holds in that owner; a claimed
  hold that does not load throws `ClaimNotLoadedError` and a tenant's hold with no isolation bound throws
  `RowIsolationMissingError` (both from `@stackra/outbox`): a held record is never let go by a skip. An app without
  tenancy still boots; its platform holds run as before.
  
  Rolling deploy: both migrations are expand steps, so the previous release keeps working beside this one for one
  release.
  
  - Search keeps a plain unique index on `(model, scope_key)` (NULLs distinct) for the previous release's
    `on conflict (model, scope_key)`, and `-` stays a valid key.
  - Privacy keeps `scope_id` (now nullable, unused by this release). `privacy.fill_legacy_scope_id` fills it on insert
    from `tenant_id` (`-` for a platform row), and the salts' primary key becomes a unique index on
    `(scope_id, subject)`.
  
  Later contract step, once no previous release runs:
  
  - Search: set each remaining `-` key to NULL (deleting one whose owner already has a NULL row), then drop
    `idx_indexes_model_scope_key`.
  - Privacy: drop the three `trg_*_legacy_scope_id` triggers, `privacy.fill_legacy_scope_id`,
    `idx_subject_salts_scope_id_subject` and the `scope_id` columns.
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
- Updated dependencies [8084b3a]
- Updated dependencies [a426842]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [98a8940]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [98a8940]
- Updated dependencies [ef49e63]
- Updated dependencies [a03990d]
- Updated dependencies [a3a3190]
- Updated dependencies [265a3ee]
- Updated dependencies [15dba8d]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/iam@0.30.0
  - @stackra/database@0.30.0
  - @stackra/filesystem@0.30.0
  - @stackra/outbox@0.30.0
  - @stackra/queue@0.30.0
  - @stackra/scheduler@0.30.0
  - @stackra/workflow@0.30.0
  - @stackra/data-transfer@0.30.0
  - @stackra/container@0.30.0
  - @stackra/search@0.30.0
  - @stackra/model@0.30.0
  - @stackra/config@0.30.0
  - @stackra/events@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/testing@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [11a19a7]
- Updated dependencies [45afd22]
- Updated dependencies [9eb3427]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/workflow@0.29.0
  - @stackra/search@0.29.0
  - @stackra/outbox@0.29.0
  - @stackra/queue@0.29.0
  - @stackra/scheduler@0.29.0
  - @stackra/iam@0.29.0
  - @stackra/data-transfer@0.29.0
  - @stackra/filesystem@0.29.0
  - @stackra/model@0.29.0
  - @stackra/config@0.29.0
  - @stackra/events@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/testing@0.29.0
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
  - @stackra/workflow@0.28.0
  - @stackra/iam@0.28.0
  - @stackra/data-transfer@0.28.0
  - @stackra/filesystem@0.28.0
  - @stackra/model@0.28.0
  - @stackra/testing@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/events@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [4a4d817]
- Updated dependencies [8a70552]
- Updated dependencies [5119f3c]
  - @stackra/database@0.27.0
  - @stackra/outbox@0.27.0
  - @stackra/data-transfer@0.27.0
  - @stackra/workflow@0.27.0
  - @stackra/search@0.27.0
  - @stackra/queue@0.27.0
  - @stackra/scheduler@0.27.0
  - @stackra/iam@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/filesystem@0.27.0
  - @stackra/model@0.27.0
  - @stackra/testing@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/events@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- 9b02a7c: A host binds the actions and queries of each package module it hosts, as it does that package's services: they are
  the module's surface, so a test or a client can call one by class (`run(EnrollMemberAction, …)`) without a host class
  injecting it. A published package's manifest lists its actions and queries in `services` with their constructor
  tokens, and the host wiring binds each one with them.
- Updated dependencies [93e358e]
- Updated dependencies [9cee75d]
- Updated dependencies [a9f21b6]
- Updated dependencies [0341ef1]
  - @stackra/database@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/iam@0.26.0
  - @stackra/workflow@0.26.0
  - @stackra/search@0.26.0
  - @stackra/outbox@0.26.0
  - @stackra/queue@0.26.0
  - @stackra/scheduler@0.26.0
  - @stackra/data-transfer@0.26.0
  - @stackra/filesystem@0.26.0
  - @stackra/model@0.26.0
  - @stackra/testing@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/events@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [1d7bbc1]
- Updated dependencies [dc9da69]
- Updated dependencies [8f8ddcf]
- Updated dependencies [3942ab1]
- Updated dependencies [fe19ac7]
- Updated dependencies [ec5272e]
  - @stackra/database@0.25.0
  - @stackra/workflow@0.25.0
  - @stackra/search@0.25.0
  - @stackra/outbox@0.25.0
  - @stackra/queue@0.25.0
  - @stackra/scheduler@0.25.0
  - @stackra/iam@0.25.0
  - @stackra/data-transfer@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/filesystem@0.25.0
  - @stackra/model@0.25.0
  - @stackra/testing@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/events@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
- Updated dependencies [2df7162]
- Updated dependencies [2df7162]
  - @stackra/actions@0.24.0
  - @stackra/database@0.24.0
  - @stackra/workflow@0.24.0
  - @stackra/search@0.24.0
  - @stackra/outbox@0.24.0
  - @stackra/queue@0.24.0
  - @stackra/scheduler@0.24.0
  - @stackra/iam@0.24.0
  - @stackra/data-transfer@0.24.0
  - @stackra/filesystem@0.24.0
  - @stackra/model@0.24.0
  - @stackra/testing@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/events@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [6edeee4]
- Updated dependencies [12f4836]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
- Updated dependencies [12f4836]
  - @stackra/database@0.23.0
  - @stackra/search@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/workflow@0.23.0
  - @stackra/outbox@0.23.0
  - @stackra/queue@0.23.0
  - @stackra/scheduler@0.23.0
  - @stackra/iam@0.23.0
  - @stackra/data-transfer@0.23.0
  - @stackra/filesystem@0.23.0
  - @stackra/model@0.23.0
  - @stackra/testing@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/events@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [b394912]
- Updated dependencies [786848c]
- Updated dependencies [acbee14]
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/events@0.22.0
  - @stackra/search@0.22.0
  - @stackra/outbox@0.22.0
  - @stackra/queue@0.22.0
  - @stackra/scheduler@0.22.0
  - @stackra/workflow@0.22.0
  - @stackra/iam@0.22.0
  - @stackra/model@0.22.0
  - @stackra/data-transfer@0.22.0
  - @stackra/filesystem@0.22.0
  - @stackra/testing@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
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
  - @stackra/scheduler@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/data-transfer@0.21.0
  - @stackra/filesystem@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/events@0.21.0
  - @stackra/outbox@0.21.0
  - @stackra/queue@0.21.0
  - @stackra/workflow@0.21.0
  - @stackra/iam@0.21.0
  - @stackra/testing@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [80d121b]
- Updated dependencies [a7b7e58]
- Updated dependencies [19a9222]
- Updated dependencies [667a3b5]
- Updated dependencies [6623da1]
  - @stackra/actions@0.20.0
  - @stackra/database@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/workflow@0.20.0
  - @stackra/search@0.20.0
  - @stackra/outbox@0.20.0
  - @stackra/queue@0.20.0
  - @stackra/scheduler@0.20.0
  - @stackra/iam@0.20.0
  - @stackra/data-transfer@0.20.0
  - @stackra/filesystem@0.20.0
  - @stackra/model@0.20.0
  - @stackra/config@0.20.0
  - @stackra/events@0.20.0
  - @stackra/testing@0.20.0
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
- Updated dependencies [9063bb3]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
- Updated dependencies [d76d1ed]
- Updated dependencies [d2b3d22]
- Updated dependencies [6ec440d]
- Updated dependencies [3833180]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/queue@0.19.0
  - @stackra/iam@0.19.0
  - @stackra/workflow@0.19.0
  - @stackra/database@0.19.0
  - @stackra/config@0.19.0
  - @stackra/filesystem@0.19.0
  - @stackra/search@0.19.0
  - @stackra/data-transfer@0.19.0
  - @stackra/model@0.19.0
  - @stackra/container@0.19.0
  - @stackra/events@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/outbox@0.19.0
  - @stackra/scheduler@0.19.0
  - @stackra/testing@0.19.0

## 0.18.1

### Patch Changes

- @stackra/scheduler@0.18.1
  - @stackra/workflow@0.18.1
  - @stackra/iam@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/data-transfer@0.18.1
  - @stackra/database@0.18.1
  - @stackra/filesystem@0.18.1
  - @stackra/model@0.18.1
  - @stackra/search@0.18.1
  - @stackra/testing@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/events@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/outbox@0.18.1
  - @stackra/queue@0.18.1

## 0.18.0

### Patch Changes

- @stackra/scheduler@0.18.0
  - @stackra/workflow@0.18.0
  - @stackra/iam@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/data-transfer@0.18.0
  - @stackra/database@0.18.0
  - @stackra/filesystem@0.18.0
  - @stackra/model@0.18.0
  - @stackra/search@0.18.0
  - @stackra/testing@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/events@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/outbox@0.18.0
  - @stackra/queue@0.18.0

## 0.17.2

### Patch Changes

- @stackra/scheduler@0.17.2
  - @stackra/workflow@0.17.2
  - @stackra/iam@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/data-transfer@0.17.2
  - @stackra/database@0.17.2
  - @stackra/filesystem@0.17.2
  - @stackra/model@0.17.2
  - @stackra/search@0.17.2
  - @stackra/testing@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/events@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/outbox@0.17.2
  - @stackra/queue@0.17.2

## 0.17.1

### Patch Changes

- @stackra/workflow@0.17.1
  - @stackra/iam@0.17.1
  - @stackra/search@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/data-transfer@0.17.1
  - @stackra/database@0.17.1
  - @stackra/filesystem@0.17.1
  - @stackra/model@0.17.1
  - @stackra/testing@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/events@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/outbox@0.17.1
  - @stackra/queue@0.17.1
  - @stackra/scheduler@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/data-transfer@0.17.0
  - @stackra/database@0.17.0
  - @stackra/filesystem@0.17.0
  - @stackra/model@0.17.0
  - @stackra/search@0.17.0
  - @stackra/testing@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/events@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/outbox@0.17.0
  - @stackra/queue@0.17.0
  - @stackra/scheduler@0.17.0
  - @stackra/workflow@0.17.0
  - @stackra/iam@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/scheduler@0.16.0
  - @stackra/search@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/database@0.16.0
  - @stackra/filesystem@0.16.0
  - @stackra/model@0.16.0
  - @stackra/config@0.16.0
  - @stackra/events@0.16.0
  - @stackra/outbox@0.16.0
  - @stackra/queue@0.16.0
  - @stackra/workflow@0.16.0
  - @stackra/iam@0.16.0
  - @stackra/data-transfer@0.16.0
  - @stackra/testing@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [0b0cf51]
  - @stackra/outbox@0.15.0
  - @stackra/data-transfer@0.15.0
  - @stackra/search@0.15.0
  - @stackra/workflow@0.15.0
  - @stackra/iam@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/database@0.15.0
  - @stackra/filesystem@0.15.0
  - @stackra/model@0.15.0
  - @stackra/testing@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/events@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/queue@0.15.0
  - @stackra/scheduler@0.15.0

## 0.14.4

### Patch Changes

- @stackra/search@0.14.4
  - @stackra/workflow@0.14.4
  - @stackra/iam@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/data-transfer@0.14.4
  - @stackra/database@0.14.4
  - @stackra/filesystem@0.14.4
  - @stackra/model@0.14.4
  - @stackra/testing@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/events@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/outbox@0.14.4
  - @stackra/queue@0.14.4
  - @stackra/scheduler@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/data-transfer@0.14.3
  - @stackra/database@0.14.3
  - @stackra/filesystem@0.14.3
  - @stackra/model@0.14.3
  - @stackra/search@0.14.3
  - @stackra/testing@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/events@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/outbox@0.14.3
  - @stackra/queue@0.14.3
  - @stackra/scheduler@0.14.3
  - @stackra/workflow@0.14.3
  - @stackra/iam@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/data-transfer@0.14.2
  - @stackra/database@0.14.2
  - @stackra/filesystem@0.14.2
  - @stackra/model@0.14.2
  - @stackra/search@0.14.2
  - @stackra/config@0.14.2
  - @stackra/events@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/outbox@0.14.2
  - @stackra/queue@0.14.2
  - @stackra/scheduler@0.14.2
  - @stackra/workflow@0.14.2
  - @stackra/iam@0.14.2
  - @stackra/testing@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/data-transfer@0.14.1
  - @stackra/database@0.14.1
  - @stackra/filesystem@0.14.1
  - @stackra/model@0.14.1
  - @stackra/search@0.14.1
  - @stackra/testing@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/events@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/outbox@0.14.1
  - @stackra/queue@0.14.1
  - @stackra/scheduler@0.14.1
  - @stackra/workflow@0.14.1
  - @stackra/iam@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/data-transfer@0.14.0
  - @stackra/database@0.14.0
  - @stackra/filesystem@0.14.0
  - @stackra/model@0.14.0
  - @stackra/search@0.14.0
  - @stackra/testing@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/events@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/outbox@0.14.0
  - @stackra/queue@0.14.0
  - @stackra/scheduler@0.14.0
  - @stackra/workflow@0.14.0
  - @stackra/iam@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/data-transfer@0.13.0
  - @stackra/database@0.13.0
  - @stackra/filesystem@0.13.0
  - @stackra/model@0.13.0
  - @stackra/search@0.13.0
  - @stackra/testing@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/events@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/outbox@0.13.0
  - @stackra/queue@0.13.0
  - @stackra/scheduler@0.13.0
  - @stackra/workflow@0.13.0
  - @stackra/iam@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/data-transfer@0.12.0
  - @stackra/database@0.12.0
  - @stackra/filesystem@0.12.0
  - @stackra/model@0.12.0
  - @stackra/search@0.12.0
  - @stackra/testing@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/events@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/outbox@0.12.0
  - @stackra/queue@0.12.0
  - @stackra/scheduler@0.12.0
  - @stackra/workflow@0.12.0
  - @stackra/iam@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/data-transfer@0.11.1
  - @stackra/database@0.11.1
  - @stackra/filesystem@0.11.1
  - @stackra/model@0.11.1
  - @stackra/search@0.11.1
  - @stackra/testing@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/events@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/outbox@0.11.1
  - @stackra/queue@0.11.1
  - @stackra/scheduler@0.11.1
  - @stackra/workflow@0.11.1
  - @stackra/iam@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/data-transfer@0.11.0
  - @stackra/database@0.11.0
  - @stackra/filesystem@0.11.0
  - @stackra/model@0.11.0
  - @stackra/search@0.11.0
  - @stackra/testing@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/events@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/outbox@0.11.0
  - @stackra/queue@0.11.0
  - @stackra/scheduler@0.11.0
  - @stackra/workflow@0.11.0
  - @stackra/iam@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/scheduler@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/filesystem@0.10.0
  - @stackra/search@0.10.0
  - @stackra/outbox@0.10.0
  - @stackra/queue@0.10.0
  - @stackra/workflow@0.10.0
  - @stackra/data-transfer@0.10.0
  - @stackra/model@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/iam@0.10.0
  - @stackra/testing@0.10.0

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
  - @stackra/actions@0.9.0
  - @stackra/filesystem@0.9.0
  - @stackra/search@0.9.0
  - @stackra/config@0.9.0
  - @stackra/events@0.9.0
  - @stackra/outbox@0.9.0
  - @stackra/workflow@0.9.0
  - @stackra/iam@0.9.0
  - @stackra/data-transfer@0.9.0
  - @stackra/testing@0.9.0

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
  - @stackra/workflow@0.8.0
  - @stackra/iam@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/data-transfer@0.8.0
  - @stackra/filesystem@0.8.0
  - @stackra/model@0.8.0
  - @stackra/config@0.8.0
  - @stackra/events@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/testing@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/scheduler@0.7.1
  - @stackra/workflow@0.7.1
  - @stackra/iam@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/data-transfer@0.7.1
  - @stackra/database@0.7.1
  - @stackra/filesystem@0.7.1
  - @stackra/model@0.7.1
  - @stackra/search@0.7.1
  - @stackra/testing@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/events@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/outbox@0.7.1
  - @stackra/queue@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [1f5bf76]
  - @stackra/iam@0.7.0
  - @stackra/search@0.7.0
  - @stackra/workflow@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/data-transfer@0.7.0
  - @stackra/database@0.7.0
  - @stackra/filesystem@0.7.0
  - @stackra/model@0.7.0
  - @stackra/testing@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/events@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/outbox@0.7.0
  - @stackra/queue@0.7.0
  - @stackra/scheduler@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/data-transfer@0.6.1
  - @stackra/database@0.6.1
  - @stackra/filesystem@0.6.1
  - @stackra/model@0.6.1
  - @stackra/search@0.6.1
  - @stackra/testing@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/events@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/outbox@0.6.1
  - @stackra/queue@0.6.1
  - @stackra/scheduler@0.6.1
  - @stackra/workflow@0.6.1
  - @stackra/iam@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
- Updated dependencies [e250d4f]
  - @stackra/database@0.6.0
  - @stackra/iam@0.6.0
  - @stackra/queue@0.6.0
  - @stackra/search@0.6.0
  - @stackra/outbox@0.6.0
  - @stackra/scheduler@0.6.0
  - @stackra/workflow@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/data-transfer@0.6.0
  - @stackra/filesystem@0.6.0
  - @stackra/model@0.6.0
  - @stackra/testing@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/events@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/search@0.5.1
  - @stackra/outbox@0.5.1
  - @stackra/queue@0.5.1
  - @stackra/scheduler@0.5.1
  - @stackra/workflow@0.5.1
  - @stackra/iam@0.5.1
  - @stackra/data-transfer@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/filesystem@0.5.1
  - @stackra/model@0.5.1
  - @stackra/testing@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/events@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/search@0.5.0
  - @stackra/workflow@0.5.0
  - @stackra/iam@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/data-transfer@0.5.0
  - @stackra/database@0.5.0
  - @stackra/filesystem@0.5.0
  - @stackra/model@0.5.0
  - @stackra/testing@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/events@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/outbox@0.5.0
  - @stackra/queue@0.5.0
  - @stackra/scheduler@0.5.0

## 0.4.0

### Patch Changes

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
- Updated dependencies [bb08f25]
- Updated dependencies [1856ee0]
- Updated dependencies [70e6c17]
- Updated dependencies [5fc0db7]
- Updated dependencies [36dbd49]
- Updated dependencies [8d29426]
- Updated dependencies [b970c98]
- Updated dependencies [2bbc0e8]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/workflow@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/queue@0.4.0
  - @stackra/container@0.4.0
  - @stackra/events@0.4.0
  - @stackra/iam@0.4.0
  - @stackra/outbox@0.4.0
  - @stackra/data-transfer@0.4.0
  - @stackra/search@0.4.0
  - @stackra/model@0.4.0
  - @stackra/scheduler@0.4.0
  - @stackra/filesystem@0.4.0
  - @stackra/config@0.4.0
  - @stackra/testing@0.4.0

## 0.3.0

### Minor Changes

- 23e556c: The subject-access export and erasure skip every field a model classifies `credential`; a declaration left with no field is omitted (STA-1677, ADR 0494).

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [30c3874]
- Updated dependencies [18ea367]
- Updated dependencies [be75ede]
- Updated dependencies [a60f4e9]
- Updated dependencies [a60f4e9]
- Updated dependencies [f05c8e5]
- Updated dependencies [a60f4e9]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/data-transfer@0.3.0
  - @stackra/events@0.3.0
  - @stackra/filesystem@0.3.0
  - @stackra/iam@0.3.0
  - @stackra/model@0.3.0
  - @stackra/outbox@0.3.0
  - @stackra/queue@0.3.0
  - @stackra/scheduler@0.3.0
  - @stackra/search@0.3.0
  - @stackra/testing@0.3.0
  - @stackra/validation@0.3.0
  - @stackra/workflow@0.3.0

## 0.2.0

### Minor Changes

- a167045: Let a user delete their own account from inside the app (App Store Review Guideline 5.1.1(v), Google Play, STA-1567).
  `@stackra/identity/node` adds `DeleteMyAccountAction` (`identity.account_deletion.request@1`, step-up `aal2`, the
  caller's own account only), `CancelAccountDeletionAction`, `ShowAccountDeletionQuery`, the hourly system job
  `EraseDueAccountsAction` and `AccountDeletionPermissions`. A deletion waits `IdentityConfig.accountDeletionGraceDays`
  (30 by default) in the new `AccountDeletions` store (`PostgresAccountDeletionsDriver` over `identity.account_deletions`,
  migration `identity.0001`; `MemoryAccountDeletionsDriver`), then the per-scope job queues privacy's `EraseSubjectAction`
  unless a legal hold names the subject (a held one is pushed back a day); `SubjectErased` then ends the provider sessions and removes
  the provider user. Events `identity.account_deletion.{scheduled,cancelled,started}.v1`. Client halves:
  `useAccountDeletion` (`./react`) and `useAccountDeletionSheet` (`./native`, with the device check), with the
  `identity.ui.account_deletion` lang keys in seven locales (`./assets/*`). `@stackra/privacy/contracts` adds the
  `SubjectHolds` port and `./node` adds its `PostgresSubjectHoldsDriver`. New dependency of identity: `@stackra/database`.

### Patch Changes

- b5141fe: Erasure reaches the analytics vendor (STA-1582). `AnalyticsDriver.erasePerson(subject)` deletes the subject's person
  and its events at the vendor: the `posthog` driver finds it by distinct id through the private API and deletes it with
  `delete_events` and `delete_recordings`, `none` deletes nothing and `memory` records the subject; any other driver
  rejects by default. `EraseAnalyticsPersonListener` (`./node`) calls it after `SubjectErased` and logs
  `analytics.erasure.erased`. New config `posthogApiHost`, `posthogProjectId` and the
  `ANALYTICS_POSTHOG_PERSONAL_API_KEY` secret (`posthogPersonalApiKey`); without them the erasure rejects instead of
  succeeding silently. The privacy README lists the analytics listener among the erasure fan-out.
- 1a9259b: The integration tier runs (STA-1570). `@stackra/vitest-config/int` adds `intTier(config)` and `INT_TESTS`
  (`src/**/__tests__/**/*.int.test.{ts,tsx}` and gen's `.stackra/tests/**/*.int.test.ts`); `servicePreset`'s `int`
  project uses the same globs. The members with `.int.test.ts` files gain `vitest.int.config.ts` and a `test:int` script,
  which the new turbo task `test:int` and the Quality Gate run on a Testcontainers Postgres.
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
  - @stackra/workflow@0.2.0
  - @stackra/data-transfer@0.2.0
  - @stackra/filesystem@0.2.0
  - @stackra/model@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- fb93026: Erasure fan-out, P0 part (data-layer gap gov6, ADR 0189 decision 2). @stackra/outbox adds `OutboxDriver.holding(value)`
  and `OutboxDriver.rewrite(id, data)` (memory and Postgres drivers; a custom driver must implement both) and
  `redactSubjectMessages(driver, subject, fields)`, which nulls the named fields in every held message, due, retrying or
  dead, whose payload names the subject. @stackra/search adds `SearchForgetService.forget(Model, ids)`, which drops rows
  from the search index and, for a semantic model, the vector index, and `passageIdOf`. @stackra/privacy's erasure saga
  gains a `redact` step before `shred` (its constructor now takes the `OutboxDriver`) and counts rewritten messages in
  the receipt as `outbox.message`; the new `UnindexErasedSubjectListener` removes the subject's remaining rows from search
  after `SubjectErased`.
- 0cfb47a: `@stackra/privacy` is gen-clean. `SubjectErased` is named `subject.erased`, so its wire name is
  `privacy.subject.erased.v1` (was written as `privacy.subject_erased`): a consumer switches to it. `SubjectErased.erased`
  and `EraseSubjectOutput.erased` are typed with the new `ErasedRecordsLine` shape (same fields as `ErasedRecords`).
  `SubjectPermissions` (`erase`, `export`) and `SubjectExportPermissions` (`purge`) declare the jobs' system permissions;
  the package now depends on `@stackra/iam`. `MemorySubjectSaltStoreDriver` takes no constructor argument: seed it with
  `put(subjects)`.
- a7b4dd1: Add a legal hold store for products outside Figentra OS (data-layer gap gov20): `CreateLegalHoldsMigration`
  (`privacy.legal_holds` and `privacy.legal_hold_refusals`, partitioned per tenant), `PostgresHoldRegistryDriver` (the
  `HoldRegistry` over it, holds through subject links, each refusal logged), `PlaceHoldAction`, `ReleaseHoldAction` and
  `ListHoldsQuery` with their schemas, and the `LegalHold` contracts type.
- 738ba15: New package `@stackra/privacy` (STA-1375): the `PersonalData` kind a module declares its personal data with (model,
  subject property, and each field's `ErasureMethod`: `shred`, `delete` or `anonymise`); the DSAR export job
  `ExportSubjectDataAction` with `SubjectExportService`, which writes a zip behind a signed link for
  `PrivacyConfig.exportTtlDays` (7) and `PurgeSubjectExportsAction` that deletes older zips; and the erasure saga
  `EraseSubjectWorkflow` (started by `EraseSubjectAction`) that honours `HoldRegistry` legal holds, crypto-shreds the
  subject key through the new `SubjectSaltStore` port, deletes or anonymises the rest through `PersonalDataStore`, and
  issues the receipt as `SubjectErased` plus an optional `ServiceAcked`. Targets PDPL and GDPR.
- c3ff8a7: Seal a subject's fields under that subject's own key, so an erasure that shreds them is real (gap gov2).
  `HasEncryptedFields({ subject: "userId" }, ...fields)` makes `EncryptedFieldsSubscriber` seal and open each row with
  the new `SubjectCipherResolver` port, and an erased subject's fields load as null. `@stackra/privacy` adds
  `SaltedSubjectCipherResolverDriver`, the `PostgresSubjectSaltStoreDriver` over the new `privacy.subject_salts` table
  (migration 0001, partitioned per tenant), and `unsealedShredFields`. `EraseSubjectWorkflow` now refuses to erase while
  a `Shred` field is not subject-sealed. `SubjectSaltStore` gains `find` and `obtain`, so custom drivers must implement
  both.

### Patch Changes

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
- ca89a64: Declare `HoldPermissions` (`privacy.hold.place` L2, `privacy.hold.release` L4, `privacy.hold.read` L1) for the legal
  hold actions and query, and type `ListHoldsOutput.holds` with the `LegalHoldLine` schema, so gen compiles both.
- dc490c0: `@stackra/privacy` declares `@stackra/queue` and `@stackra/scheduler`, which gen's generated registrations of its jobs
  import (gen refused the package with `generated_dependency_missing`). Its test config merges gen's
  `./.stackra/vitest.config`.
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
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [dddbbcd]
- Updated dependencies [e2a4b0d]
- Updated dependencies [b3c4658]
- Updated dependencies [975b28c]
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
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [d156aa8]
- Updated dependencies [6dd5245]
- Updated dependencies [a289662]
- Updated dependencies [d72a734]
- Updated dependencies [2787c1e]
- Updated dependencies [20f3fe9]
- Updated dependencies [6919ebd]
- Updated dependencies [27efea7]
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
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
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
- Updated dependencies [ad2a950]
- Updated dependencies [fc44266]
- Updated dependencies [2787c1e]
- Updated dependencies [7441e28]
- Updated dependencies [eb2572b]
  - @stackra/actions@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/data-transfer@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/search@0.1.0
  - @stackra/filesystem@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/queue@0.1.0
  - @stackra/scheduler@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0
  - @stackra/workflow@0.1.0

Written by Changesets on release; never edited by hand.
