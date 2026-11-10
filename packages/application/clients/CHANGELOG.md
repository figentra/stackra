# @stackra/clients

## 0.33.0

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [4937622]
- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/actions@0.33.0
  - @stackra/entitlements@0.33.0
  - @stackra/i18n@0.33.0
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/iam@0.33.0
  - @stackra/query@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/container@0.33.0
  - @stackra/events@0.33.0
  - @stackra/transport@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
  - @stackra/config@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/i18n@0.32.0
  - @stackra/query@0.32.0
  - @stackra/iam@0.32.0
  - @stackra/entitlements@0.32.0
  - @stackra/transport@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
- Updated dependencies [0f05f60]
  - @stackra/actions@0.31.0
  - @stackra/i18n@0.31.0
  - @stackra/entitlements@0.31.0
  - @stackra/iam@0.31.0
  - @stackra/query@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/events@0.31.0
  - @stackra/transport@0.31.0
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
- Updated dependencies [0394e56]
- Updated dependencies [a426842]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/iam@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/container@0.30.0
  - @stackra/entitlements@0.30.0
  - @stackra/query@0.30.0
  - @stackra/config@0.30.0
  - @stackra/events@0.30.0
  - @stackra/i18n@0.30.0
  - @stackra/transport@0.30.0
  - @stackra/validation@0.30.0

## 0.29.0

### Minor Changes

- 0e8f570: Products can read real plans. `@stackra/entitlements` adds `ServicePlanSnapshotsDriver`, a `PlanSnapshots` that asks
  the plan service through the new `PlanServiceChannel` port and caches each answer for its `maxAgeSeconds`. It fails
  closed: a failed call, an answer for another scope or an undecodable grant reads as no plan and is not cached.
  `@stackra/clients` adds `TransportPlanServiceChannelDriver`, the channel over the host's `ClientTransport` calling
  `entitlements.effective_set.snapshot.get@1`. A product binds both in place of `MemoryPlanSnapshotsDriver`, so
  `@Requires`, the entitlement check and reserve-then-commit answer from the tenant's actual plan.

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [0e8f570]
- Updated dependencies [45afd22]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/entitlements@0.29.0
  - @stackra/iam@0.29.0
  - @stackra/query@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/events@0.29.0
  - @stackra/i18n@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/transport@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/iam@0.28.0
  - @stackra/query@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/events@0.28.0
  - @stackra/i18n@0.28.0
  - @stackra/transport@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- @stackra/iam@0.27.0
  - @stackra/query@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/events@0.27.0
  - @stackra/i18n@0.27.0
  - @stackra/transport@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [9cee75d]
  - @stackra/actions@0.26.0
  - @stackra/iam@0.26.0
  - @stackra/query@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/events@0.26.0
  - @stackra/i18n@0.26.0
  - @stackra/transport@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- @stackra/iam@0.25.0
  - @stackra/query@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/events@0.25.0
  - @stackra/i18n@0.25.0
  - @stackra/transport@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
  - @stackra/actions@0.24.0
  - @stackra/iam@0.24.0
  - @stackra/query@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/events@0.24.0
  - @stackra/i18n@0.24.0
  - @stackra/transport@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Minor Changes

- a42a80c: A service now proves who it is when it calls another service, and who it acts for.
  
  - An outgoing service call sends the service's own token (`Authorization: Bearer`). `ServiceTokens` in
    `@stackra/identity` answers it, with a memory driver for tests; the token is issued for the receiving product's
    project, set per module in `clients.audiences`.
  - When the call acts for a user, it also sends that user's own token in `Stackra-On-Behalf-Of`. `serveGuardedCall` in
    `@stackra/app/server` keeps that token for the one request and empties it when the request ends. It is never put on
    the actor, the call context, a log, an error or an event.
  - A user's token travels one hop. A service called for a user forwards it again only into an action that declares
    `onBehalfOf: { secondHop: true }`; otherwise its own calls carry the service token alone.
  - `ServiceClientSessionDriver` (`service`) is the `ClientSession` a service binds for its generated clients, and
    `ClientSession.headers` now receives the call it is about to send.
  - Generated endpoints name their action to `serveGuardedCall`, which reads its second-hop option. A hand-written
    controller forwards only a user's own token, never a forwarded one.

### Patch Changes

- Updated dependencies [a42a80c]
  - @stackra/actions@0.23.0
  - @stackra/iam@0.23.0
  - @stackra/query@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/events@0.23.0
  - @stackra/i18n@0.23.0
  - @stackra/transport@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [786848c]
- Updated dependencies [acbee14]
  - @stackra/actions@0.22.0
  - @stackra/events@0.22.0
  - @stackra/iam@0.22.0
  - @stackra/query@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/i18n@0.22.0
  - @stackra/transport@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/events@0.21.0
  - @stackra/i18n@0.21.0
  - @stackra/transport@0.21.0
  - @stackra/iam@0.21.0
  - @stackra/query@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/actions@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/iam@0.20.0
  - @stackra/query@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/events@0.20.0
  - @stackra/i18n@0.20.0
  - @stackra/transport@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

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
  - @stackra/config@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/events@0.19.0
  - @stackra/i18n@0.19.0
  - @stackra/transport@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/query@0.19.0

## 0.18.1

### Patch Changes

- @stackra/iam@0.18.1
  - @stackra/query@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/events@0.18.1
  - @stackra/i18n@0.18.1
  - @stackra/transport@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- @stackra/iam@0.18.0
  - @stackra/query@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/events@0.18.0
  - @stackra/i18n@0.18.0
  - @stackra/transport@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- @stackra/iam@0.17.2
  - @stackra/query@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/events@0.17.2
  - @stackra/i18n@0.17.2
  - @stackra/transport@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- @stackra/iam@0.17.1
  - @stackra/query@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/events@0.17.1
  - @stackra/i18n@0.17.1
  - @stackra/transport@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/events@0.17.0
  - @stackra/i18n@0.17.0
  - @stackra/transport@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/iam@0.17.0
  - @stackra/query@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/query@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/events@0.16.0
  - @stackra/i18n@0.16.0
  - @stackra/iam@0.16.0
  - @stackra/transport@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/iam@0.15.0
  - @stackra/query@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/events@0.15.0
  - @stackra/i18n@0.15.0
  - @stackra/transport@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/query@0.14.4
  - @stackra/iam@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/events@0.14.4
  - @stackra/i18n@0.14.4
  - @stackra/transport@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/events@0.14.3
  - @stackra/i18n@0.14.3
  - @stackra/transport@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/iam@0.14.3
  - @stackra/query@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/events@0.14.2
  - @stackra/i18n@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/iam@0.14.2
  - @stackra/query@0.14.2
  - @stackra/transport@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/events@0.14.1
  - @stackra/i18n@0.14.1
  - @stackra/transport@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/iam@0.14.1
  - @stackra/query@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/events@0.14.0
  - @stackra/i18n@0.14.0
  - @stackra/transport@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/iam@0.14.0
  - @stackra/query@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/events@0.13.0
  - @stackra/i18n@0.13.0
  - @stackra/transport@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/iam@0.13.0
  - @stackra/query@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/events@0.12.0
  - @stackra/i18n@0.12.0
  - @stackra/transport@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/iam@0.12.0
  - @stackra/query@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/events@0.11.1
  - @stackra/i18n@0.11.1
  - @stackra/transport@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/iam@0.11.1
  - @stackra/query@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/events@0.11.0
  - @stackra/i18n@0.11.0
  - @stackra/transport@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/iam@0.11.0
  - @stackra/query@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/i18n@0.10.0
  - @stackra/query@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/transport@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/iam@0.10.0

## 0.9.0

### Minor Changes

- 681d01a: The panel's generic resource pages on React Native. `@stackra/clients/native` is a new entry with the native data
  hooks: `useQuery`, which refetches a stale answer when the app returns to the foreground, and `useAction`, the same
  action hook as on the web. `@stackra/panel/native` adds `ResourceListPage`, `ResourceViewPage`, `ResourceFormPage` and
  `ActionInputModal` with the web pages' props: the list with search, filters, sort, cursor paging, views, row and bulk
  actions and pull to refresh; the record with its entries and sections; the Create and Edit form drawn from the action's
  input and checked by its schema; and the action form for an input that needs more than the record id. Every run goes
  through a native action runner with the declared confirmation and toasts. Each page takes the resource, and a View or
  Edit page the record id, from the host screen until gen registers resource screens on native. The showcase lists the
  four for native.

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/events@0.9.0
  - @stackra/i18n@0.9.0
  - @stackra/iam@0.9.0
  - @stackra/query@0.9.0
  - @stackra/transport@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/iam@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/events@0.8.0
  - @stackra/i18n@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/query@0.8.0
  - @stackra/transport@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/iam@0.7.1
  - @stackra/query@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/events@0.7.1
  - @stackra/i18n@0.7.1
  - @stackra/transport@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [1f5bf76]
  - @stackra/iam@0.7.0
  - @stackra/query@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/events@0.7.0
  - @stackra/i18n@0.7.0
  - @stackra/transport@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/events@0.6.1
  - @stackra/i18n@0.6.1
  - @stackra/transport@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/iam@0.6.1
  - @stackra/query@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [e250d4f]
  - @stackra/iam@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/events@0.6.0
  - @stackra/i18n@0.6.0
  - @stackra/transport@0.6.0
  - @stackra/validation@0.6.0
  - @stackra/query@0.6.0

## 0.5.1

### Patch Changes

- @stackra/iam@0.5.1
  - @stackra/query@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/events@0.5.1
  - @stackra/i18n@0.5.1
  - @stackra/transport@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [d7f72d3]
  - @stackra/i18n@0.5.0
  - @stackra/iam@0.5.0
  - @stackra/query@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/events@0.5.0
  - @stackra/transport@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Patch Changes

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
  - @stackra/query@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/i18n@0.4.0
  - @stackra/transport@0.4.0

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
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/events@0.3.0
  - @stackra/i18n@0.3.0
  - @stackra/iam@0.3.0
  - @stackra/query@0.3.0
  - @stackra/transport@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/iam@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/transport@0.2.0
  - @stackra/query@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/i18n@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 0202770: Add `DynamicClient` and `DynamicCall` to call a key registered at runtime, `ClientsOptions.producers` with
  `producerBaseUrl` for a base URL per producer module, and `CallOptions.scope` sent in `ClientsOptions.scopeHeader`
  (STA-1261).
- 2787c1e: Add `@stackra/clients`, the runtime of the generated clients: the ref factories `#stackra/clients/<service>` is written over (actions, queries with their replica declarations, events, refusals, shapes, widgets, modules, permissions, intents), `ServiceClient` with `call` and `queue`, the HTTP `ClientTransport` driver, the drivers of `@stackra/query`'s offline ports (the `MutationSender` that replays the queue with its device order, the `ReplicaSource` and the `AcknowledgementReader`) with the `DEVICE_ORDER` wire names, the React query and action hooks, the Worker's public clients and forwarded facts, and `fakeClient`.
- 0a38324: Gen writes the driver candidates of every declared package into the member wiring (memory, postgres and valkey alike),
  from the `classes` and `config` that package manifests now record, keeps an authored root `vitest.config.ts` that
  imports `./.stackra/vitest.config`, and the generated test setup loads `@stackra/clients/testing`. `@stackra/clients`
  adds a ClientFake-based memory `ClientTransport` (`CLIENTS_TESTING_PLUGIN`) and the `memoryTransport(app)` helper.
- 150fa18: `RetryOn` moves to @stackra/contracts (`./server` re-exports it). `createPublicClients`' `retry` is the contracts
  `RetryPolicy`: `on` became `retryOn`. (stackra-223)

### Patch Changes

- 2787c1e: Add `@stackra/iam`: the `Permissions`, `Permission` (L0 to L4, `.system()`), `Policy<M>` and `Role({ grants })` kinds,
  `Decision`, `Risk` and `SystemRole`, the embedded policy decision point (scoped grants that inherit downward, explicit
  deny with `@stackra/rules` conditions and audiences that name `@stackra/segments`' `SegmentRef`, record
  visibility and `visibleCondition`, the delegation bound), the action pipeline's
  `AccessControl` driver, the scope package's `GrantedScopes` driver, the record-visibility query filter
  (`IamVisibilityFilterDriver` for `@stackra/database`'s `VisibilityFilter` and `registerVisibility`, `./node`),
  `usePermission` (`./react`) and `actors` (`./testing`); `@stackra/clients` types an action ref's `risk` as `Risk`.
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
- Updated dependencies [e7ee0a4]
- Updated dependencies [a701ccb]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [6f2c1f7]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
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
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [0e7eb1f]
- Updated dependencies [e7a388a]
- Updated dependencies [2d7233c]
- Updated dependencies [2787c1e]
- Updated dependencies [6912039]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [074d3e8]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [ca44233]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
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
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/query@0.1.0
  - @stackra/transport@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
