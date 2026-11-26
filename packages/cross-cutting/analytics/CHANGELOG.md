# @stackra/analytics

## 0.33.1

### Patch Changes

- Updated dependencies [bf2c6ea]
- Updated dependencies [e885a38]
  - @stackra/contracts@0.33.1
  - @stackra/storage@0.33.1
  - @stackra/iam@0.33.1
  - @stackra/privacy@0.33.1
  - @stackra/actions@0.33.1
  - @stackra/platform@0.33.1
  - @stackra/config@0.33.1
  - @stackra/container@0.33.1
  - @stackra/events@0.33.1
  - @stackra/validation@0.33.1
  - @stackra/consent@0.33.1

## 0.33.0

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/actions@0.33.0
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/iam@0.33.0
  - @stackra/consent@0.33.0
  - @stackra/privacy@0.33.0
  - @stackra/platform@0.33.0
  - @stackra/storage@0.33.0
  - @stackra/container@0.33.0
  - @stackra/events@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
  - @stackra/config@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/platform@0.32.0
  - @stackra/consent@0.32.0
  - @stackra/privacy@0.32.0
  - @stackra/iam@0.32.0
  - @stackra/storage@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
  - @stackra/actions@0.31.0
  - @stackra/consent@0.31.0
  - @stackra/iam@0.31.0
  - @stackra/privacy@0.31.0
  - @stackra/storage@0.31.0
  - @stackra/platform@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/events@0.31.0
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

- Updated dependencies [418e195]
- Updated dependencies [6005425]
- Updated dependencies [0394e56]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [a426842]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [265a3ee]
- Updated dependencies [d5a7d0a]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/iam@0.30.0
  - @stackra/privacy@0.30.0
  - @stackra/container@0.30.0
  - @stackra/consent@0.30.0
  - @stackra/storage@0.30.0
  - @stackra/platform@0.30.0
  - @stackra/config@0.30.0
  - @stackra/events@0.30.0
  - @stackra/validation@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [45afd22]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/consent@0.29.0
  - @stackra/iam@0.29.0
  - @stackra/privacy@0.29.0
  - @stackra/storage@0.29.0
  - @stackra/platform@0.29.0
  - @stackra/config@0.29.0
  - @stackra/events@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/consent@0.28.0
  - @stackra/iam@0.28.0
  - @stackra/privacy@0.28.0
  - @stackra/storage@0.28.0
  - @stackra/platform@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/events@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- @stackra/iam@0.27.0
  - @stackra/privacy@0.27.0
  - @stackra/consent@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/storage@0.27.0
  - @stackra/platform@0.27.0
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
- Updated dependencies [9b02a7c]
- Updated dependencies [9cee75d]
  - @stackra/consent@0.26.0
  - @stackra/privacy@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/iam@0.26.0
  - @stackra/storage@0.26.0
  - @stackra/platform@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/events@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- @stackra/iam@0.25.0
  - @stackra/privacy@0.25.0
  - @stackra/consent@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/storage@0.25.0
  - @stackra/platform@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/events@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
  - @stackra/actions@0.24.0
  - @stackra/consent@0.24.0
  - @stackra/iam@0.24.0
  - @stackra/privacy@0.24.0
  - @stackra/storage@0.24.0
  - @stackra/platform@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/events@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [a42a80c]
  - @stackra/actions@0.23.0
  - @stackra/iam@0.23.0
  - @stackra/privacy@0.23.0
  - @stackra/consent@0.23.0
  - @stackra/storage@0.23.0
  - @stackra/platform@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/events@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [786848c]
- Updated dependencies [acbee14]
  - @stackra/actions@0.22.0
  - @stackra/events@0.22.0
  - @stackra/iam@0.22.0
  - @stackra/privacy@0.22.0
  - @stackra/consent@0.22.0
  - @stackra/storage@0.22.0
  - @stackra/platform@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/storage@0.21.0
  - @stackra/platform@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/events@0.21.0
  - @stackra/consent@0.21.0
  - @stackra/iam@0.21.0
  - @stackra/privacy@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/actions@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/consent@0.20.0
  - @stackra/iam@0.20.0
  - @stackra/privacy@0.20.0
  - @stackra/storage@0.20.0
  - @stackra/platform@0.20.0
  - @stackra/config@0.20.0
  - @stackra/events@0.20.0
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

- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/iam@0.19.0
  - @stackra/privacy@0.19.0
  - @stackra/consent@0.19.0
  - @stackra/config@0.19.0
  - @stackra/platform@0.19.0
  - @stackra/storage@0.19.0
  - @stackra/container@0.19.0
  - @stackra/events@0.19.0
  - @stackra/validation@0.19.0

## 0.18.1

### Patch Changes

- @stackra/privacy@0.18.1
  - @stackra/iam@0.18.1
  - @stackra/consent@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/storage@0.18.1
  - @stackra/platform@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/events@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- @stackra/privacy@0.18.0
  - @stackra/iam@0.18.0
  - @stackra/consent@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/storage@0.18.0
  - @stackra/platform@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/events@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- @stackra/privacy@0.17.2
  - @stackra/iam@0.17.2
  - @stackra/consent@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/storage@0.17.2
  - @stackra/platform@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/events@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- @stackra/iam@0.17.1
  - @stackra/privacy@0.17.1
  - @stackra/consent@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/storage@0.17.1
  - @stackra/platform@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/events@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/storage@0.17.0
  - @stackra/platform@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/events@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/consent@0.17.0
  - @stackra/iam@0.17.0
  - @stackra/privacy@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/storage@0.16.0
  - @stackra/platform@0.16.0
  - @stackra/config@0.16.0
  - @stackra/events@0.16.0
  - @stackra/consent@0.16.0
  - @stackra/iam@0.16.0
  - @stackra/privacy@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/privacy@0.15.0
  - @stackra/iam@0.15.0
  - @stackra/consent@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/storage@0.15.0
  - @stackra/platform@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/events@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/privacy@0.14.4
  - @stackra/iam@0.14.4
  - @stackra/consent@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/storage@0.14.4
  - @stackra/platform@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/events@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/storage@0.14.3
  - @stackra/platform@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/events@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/consent@0.14.3
  - @stackra/iam@0.14.3
  - @stackra/privacy@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/storage@0.14.2
  - @stackra/platform@0.14.2
  - @stackra/config@0.14.2
  - @stackra/events@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/consent@0.14.2
  - @stackra/iam@0.14.2
  - @stackra/privacy@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/storage@0.14.1
  - @stackra/platform@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/events@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/consent@0.14.1
  - @stackra/iam@0.14.1
  - @stackra/privacy@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/storage@0.14.0
  - @stackra/platform@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/events@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/consent@0.14.0
  - @stackra/iam@0.14.0
  - @stackra/privacy@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/storage@0.13.0
  - @stackra/platform@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/events@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/consent@0.13.0
  - @stackra/iam@0.13.0
  - @stackra/privacy@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/storage@0.12.0
  - @stackra/platform@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/events@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/consent@0.12.0
  - @stackra/iam@0.12.0
  - @stackra/privacy@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/storage@0.11.1
  - @stackra/platform@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/events@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/consent@0.11.1
  - @stackra/iam@0.11.1
  - @stackra/privacy@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/storage@0.11.0
  - @stackra/platform@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/events@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/consent@0.11.0
  - @stackra/iam@0.11.0
  - @stackra/privacy@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/platform@0.10.0
  - @stackra/consent@0.10.0
  - @stackra/privacy@0.10.0
  - @stackra/storage@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/iam@0.10.0

## 0.9.0

### Minor Changes

- cc375d5: `./contracts` adds the `AnalyticsStore` port, Stackra's own store of analytics deliveries (ADR 0190 decision 3 as
  amended), with its `AnalyticsStoreQuery`: `append` keeps a delivery once per event id, `scan` reads a capture-time
  window oldest first, and `erasePerson` deletes a subject's identified and anonymous deliveries. `./node` adds its
  `memory` driver, `MemoryAnalyticsStoreDriver`, for tests and previews. The ClickHouse and DuckDB drivers are Pro and
  wait on ADR 0227, which still defers an OLAP engine.

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/storage@0.9.0
  - @stackra/platform@0.9.0
  - @stackra/config@0.9.0
  - @stackra/events@0.9.0
  - @stackra/consent@0.9.0
  - @stackra/iam@0.9.0
  - @stackra/privacy@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/iam@0.8.0
  - @stackra/privacy@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/storage@0.8.0
  - @stackra/platform@0.8.0
  - @stackra/config@0.8.0
  - @stackra/events@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/consent@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/privacy@0.7.1
  - @stackra/iam@0.7.1
  - @stackra/consent@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/storage@0.7.1
  - @stackra/platform@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/events@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [1f5bf76]
  - @stackra/iam@0.7.0
  - @stackra/consent@0.7.0
  - @stackra/privacy@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/storage@0.7.0
  - @stackra/platform@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/events@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/storage@0.6.1
  - @stackra/platform@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/events@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/consent@0.6.1
  - @stackra/iam@0.6.1
  - @stackra/privacy@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [e250d4f]
  - @stackra/iam@0.6.0
  - @stackra/privacy@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/storage@0.6.0
  - @stackra/platform@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/events@0.6.0
  - @stackra/validation@0.6.0
  - @stackra/consent@0.6.0

## 0.5.1

### Patch Changes

- @stackra/iam@0.5.1
  - @stackra/privacy@0.5.1
  - @stackra/consent@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/storage@0.5.1
  - @stackra/platform@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/events@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/consent@0.5.0
  - @stackra/iam@0.5.0
  - @stackra/privacy@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/storage@0.5.0
  - @stackra/platform@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/events@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Minor Changes

- 36c9363: Analytics relay (STA-1624, ADR 0483). Apps send product analytics only to the analytics service: the new `relay`
  driver (`.` and `./native`) posts the envelope deliveries unchanged to `<ingestOrigin>/analytics/batches` with the
  `Stackra-Consent` header, and holds no vendor key, SDK or host. `./node` adds `IngestAnalyticsBatchAction`
  (`analytics_batch.ingest`, public), which reads the verified consent snapshot, binds deliveries to its subject, strips
  `denyProperties` and publishes one `AnalyticsBatchAccepted` per granted destination, and `FanOutAnalyticsListener`,
  which sends each to its destination's driver. `AnalyticsContext` gains a coarse `device` record, which the PostHog
  driver maps to `$os`, `$os_version`, `$app_build` and `$device_type` (with `$app_version`); a server send turns
  PostHog's GeoIP off. `ANALYTICS_INGEST_PATH` joins `./contracts`.

### Patch Changes

- a8c358a: The delivery schema's optional fields are exact-optional, so its output fits `AnalyticsDelivery` under `exactOptionalPropertyTypes` and `@Field` accepts `deliveries`. A delivery that sends an optional field as an explicit `undefined` is now refused; omit it instead.
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
- Updated dependencies [90f55b1]
- Updated dependencies [688cf0c]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [79dc807]
- Updated dependencies [bb08f25]
- Updated dependencies [1856ee0]
- Updated dependencies [70e6c17]
- Updated dependencies [5fc0db7]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0
  - @stackra/events@0.4.0
  - @stackra/iam@0.4.0
  - @stackra/consent@0.4.0
  - @stackra/privacy@0.4.0
  - @stackra/storage@0.4.0
  - @stackra/platform@0.4.0
  - @stackra/config@0.4.0

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
  - @stackra/actions@0.3.0
  - @stackra/config@0.3.0
  - @stackra/consent@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/events@0.3.0
  - @stackra/platform@0.3.0
  - @stackra/privacy@0.3.0
  - @stackra/storage@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Minor Changes

- b5141fe: Erasure reaches the analytics vendor (STA-1582). `AnalyticsDriver.erasePerson(subject)` deletes the subject's person
  and its events at the vendor: the `posthog` driver finds it by distinct id through the private API and deletes it with
  `delete_events` and `delete_recordings`, `none` deletes nothing and `memory` records the subject; any other driver
  rejects by default. `EraseAnalyticsPersonListener` (`./node`) calls it after `SubjectErased` and logs
  `analytics.erasure.erased`. New config `posthogApiHost`, `posthogProjectId` and the
  `ANALYTICS_POSTHOG_PERSONAL_API_KEY` secret (`posthogPersonalApiKey`); without them the erasure rejects instead of
  succeeding silently. The privacy README lists the analytics listener among the erasure fan-out.

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [b5141fe]
- Updated dependencies [a167045]
- Updated dependencies [1a9259b]
- Updated dependencies [9085c41]
- Updated dependencies [3d18ae6]
- Updated dependencies [6f67da8]
  - @stackra/actions@0.2.0
  - @stackra/privacy@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/platform@0.2.0
  - @stackra/consent@0.2.0
  - @stackra/storage@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 072a443: Ad conversions on both sides with one dedup id. `@stackra/analytics` adds the `ad-pixel` driver of `AnalyticsDriver`
  (a destination gated by `marketing` that fires the tracked events `conversions` names on the new `AdPixel` port, with
  the `ref` property's value as the event id), the `none` `AdPixel` driver, the `conversions` and `adPixelDriver`
  settings, and `adClickIdOf` for the landing URL's ad click id. `@stackra/integrations` adds the conversion bridge:
  `Conversion` (payload paths), `conversionOf` and `ConversionBridge`, which send an integration event such as
  `order.placed` through `gateway.ads()` only when its consent grants `marketing`; `ConversionEvent` carries that consent
  and `AdPlatformConnector` an optional `phoneFormat`.
- f9093c1: Auto-capture: `useAutocapture(path)` (web) tracks `page.viewed` per path and `element.clicked` for `data-track`
  elements, and `useScreenViews(screen)` (native) tracks `screen.viewed`, as `autocapturePageviews` and
  `autocaptureClicks` switch them on. Breaking: `AnalyticsConfig.webVitals` and `sessionReplay` are removed;
  `TelemetryConfig.vitals` and `replay` (@stackra/logger) are their one owner.
- 31e1259: Delivery engine in `AnalyticsClient`: batches at `flushAt` or after `flushIntervalMs`, `flush()`, bounded retry
  with `backoffDelay` (`retryAttempts`, `retryBaseMs`, `retryMaxMs`, `bufferLimit`), per-visitor sampling
  (`sampleRate`, per-event `sampleRates`), the page-hide beacon (`AnalyticsDriver.beacon`, implemented by the PostHog
  driver with `navigator.sendBeacon`), and the optional `AnalyticsOfflineQueue` (`none`, `memory`, `storage` drivers;
  `offlineDriver`, `offlineLimit`) that keeps batches whose retries are spent for the next launch. Drivers no longer
  retry: the native PostHog driver's `send` resolves once its buffer holds the events.
- bdf1116: `AnalyticsDelivery` envelope v2: every delivery now carries `eventId` (`evt_` and a time-ordered Crockford id, for
  dedup across destinations), `anonymousId` and `sessionId` (made only after consent, held in memory for the launch),
  an optional `userId`, and an `AnalyticsContext` (library, page path, locale; screen, app version and region when set).
  The PostHog drivers send these ids instead of making their own. Drivers of `AnalyticsDriver` must accept the new
  fields.
- f3d2a51: Send analytics to several destinations: `drivers` names extra driver instances and `destinations` lists where
  deliveries go, each gated by its own consent category and routed by `include` and `exclude` event names, with its own
  queue, buffer and retries. Adds the `AnalyticsDriverLookup` port and its `none` driver.
- 6912039: Delivery follows the phone's power and data saving (STA-1536): while `SystemSettings` reports Low Power Mode or an
  expensive connection, a buffer ignores `flushAt` and waits four flush windows, leaving at once only at `bufferLimit`.
- 1d4bec6: Identity stitching: `AnalyticsClient.identify(userId)`, `group(type, id)` and `reset()`. Both calls are deliveries
  of their own `AnalyticsDeliveryKind` (`identify`, `group`), gated and queued like events; later events carry `userId`
  and `groups`. The new `AnalyticsIdentity` port keeps the anonymous id across launches only while consent holds, with
  `memory` (default), `cookie` and `storage` drivers and the `identityDriver`, `identityCookieName` and
  `identityExpiryDays` settings. The PostHog driver maps `identify` to `$identify` and `group` to `$groupidentify`, and
  sends an identified visitor's events as the user with a person profile.
- 2787c1e: Add `@stackra/analytics`, consent-gated product analytics delivery per ADR 0298: `AnalyticsClient.track` sends an `AnalyticsEvent` through the `AnalyticsDriver` port only once its consent category is granted, holds earlier events in a bounded ordered queue that is sent on acceptance and discarded on refusal, with `AnalyticsConfig` and its shipped schema, the `none` driver, `useAnalytics` and `fakeAnalytics`.
- b58ebce: Add the `posthog` analytics driver: `PosthogAnalyticsDriver` in `.` posts each send to PostHog's batch capture endpoint
  with plain `fetch`, behind the client's consent gate and bounded queue, with an in-memory anonymous id created only on
  the first send after consent and no person profile. Add `posthogKey` and `posthogHost` to `AnalyticsConfig`. Add the
  `./native` entry, whose `PosthogAnalyticsDriver` batches 20 events and flushes when React Native's `AppState` goes to
  the background (React Native is an optional peer). Move `MemoryAnalyticsDriver` from `./testing` to `.`, since gen's
  wiring offers it as a production driver and production code never imports `./testing`.
- 62a97c0: Add server analytics: `Action({ analytics })` and `Query({ analytics })` take `true` (the generic `action.called` event
  with key, outcome, duration and origin) or an `AnalyticsEvent` class (its declared fields from the output, then the
  input). The pipeline writes `AnalyticsTracked` (`analytics.tracked.v1`) through the outbox, in the unit of work for a
  successful action, only when the call's verified consent grants `analytics`. The new `@stackra/analytics/node` entry
  ships `RelayTrackedAnalyticsListener`, which sends each event to the bound `AnalyticsDriver` (stackra-410, STA-1512).

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
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
- Updated dependencies [fadd825]
- Updated dependencies [0c46afb]
- Updated dependencies [2787c1e]
- Updated dependencies [2e21e6a]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [0ee0d06]
- Updated dependencies [48e9fed]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [e7ee0a4]
- Updated dependencies [a701ccb]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [3a94a6e]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [de4d77d]
- Updated dependencies [cc96d5d]
- Updated dependencies [d63f012]
- Updated dependencies [072dc7e]
- Updated dependencies [b58ebce]
- Updated dependencies [1723c05]
- Updated dependencies [d15a219]
- Updated dependencies [8ce76e9]
- Updated dependencies [c46f32f]
- Updated dependencies [2c2beca]
- Updated dependencies [9e63234]
- Updated dependencies [04a0f8c]
- Updated dependencies [544b42d]
- Updated dependencies [2787c1e]
- Updated dependencies [90957bd]
- Updated dependencies [1b4effa]
- Updated dependencies [6855121]
- Updated dependencies [d7ed271]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8992b7a]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/events@0.1.0
  - @stackra/config@0.1.0
  - @stackra/platform@0.1.0
  - @stackra/consent@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/storage@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
