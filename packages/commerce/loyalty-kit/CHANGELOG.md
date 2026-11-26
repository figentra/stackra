# @stackra/loyalty-kit

## 0.33.1

### Patch Changes

- Updated dependencies [e885a38]
- Updated dependencies [bf2c6ea]
- Updated dependencies [e885a38]
  - @stackra/database@0.33.1
  - @stackra/contracts@0.33.1
  - @stackra/tenancy@0.33.1
  - @stackra/settings@0.33.1
  - @stackra/scheduler@0.33.1
  - @stackra/ledger@0.33.1
  - @stackra/search@0.33.1
  - @stackra/panel@0.33.1
  - @stackra/outbox@0.33.1
  - @stackra/queue@0.33.1
  - @stackra/workflow@0.33.1
  - @stackra/iam@0.33.1
  - @stackra/actions@0.33.1
  - @stackra/money@0.33.1
  - @stackra/integrations@0.33.1
  - @stackra/versioning@0.33.1
  - @stackra/model@0.33.1
  - @stackra/ui@0.33.1
  - @stackra/experience@0.33.1
  - @stackra/config@0.33.1
  - @stackra/container@0.33.1
  - @stackra/errors@0.33.1
  - @stackra/events@0.33.1
  - @stackra/i18n@0.33.1
  - @stackra/validation@0.33.1
  - @stackra/testing@0.33.1

## 0.33.0

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [4937622]
- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [628b60d]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [41a5ff0]
- Updated dependencies [03da426]
- Updated dependencies [246594d]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
- Updated dependencies [41a5ff0]
- Updated dependencies [22493bf]
- Updated dependencies [44ca288]
  - @stackra/actions@0.33.0
  - @stackra/i18n@0.33.0
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/workflow@0.33.0
  - @stackra/settings@0.33.0
  - @stackra/iam@0.33.0
  - @stackra/queue@0.33.0
  - @stackra/testing@0.33.0
  - @stackra/tenancy@0.33.0
  - @stackra/model@0.33.0
  - @stackra/database@0.33.0
  - @stackra/ui@0.33.0
  - @stackra/integrations@0.33.0
  - @stackra/search@0.33.0
  - @stackra/panel@0.33.0
  - @stackra/outbox@0.33.0
  - @stackra/scheduler@0.33.0
  - @stackra/experience@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/ledger@0.33.0
  - @stackra/money@0.33.0
  - @stackra/versioning@0.33.0
  - @stackra/container@0.33.0
  - @stackra/events@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
- Updated dependencies [54db249]
- Updated dependencies [918c766]
  - @stackra/config@0.32.0
  - @stackra/ui@0.32.0
  - @stackra/workflow@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/integrations@0.32.0
  - @stackra/database@0.32.0
  - @stackra/search@0.32.0
  - @stackra/panel@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/i18n@0.32.0
  - @stackra/outbox@0.32.0
  - @stackra/queue@0.32.0
  - @stackra/scheduler@0.32.0
  - @stackra/tenancy@0.32.0
  - @stackra/settings@0.32.0
  - @stackra/iam@0.32.0
  - @stackra/experience@0.32.0
  - @stackra/ledger@0.32.0
  - @stackra/versioning@0.32.0
  - @stackra/money@0.32.0
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
- Updated dependencies [0f05f60]
- Updated dependencies [7179d1a]
- Updated dependencies [29af13d]
- Updated dependencies [137a7f9]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/i18n@0.31.0
  - @stackra/settings@0.31.0
  - @stackra/panel@0.31.0
  - @stackra/ui@0.31.0
  - @stackra/workflow@0.31.0
  - @stackra/integrations@0.31.0
  - @stackra/search@0.31.0
  - @stackra/outbox@0.31.0
  - @stackra/queue@0.31.0
  - @stackra/scheduler@0.31.0
  - @stackra/iam@0.31.0
  - @stackra/tenancy@0.31.0
  - @stackra/ledger@0.31.0
  - @stackra/experience@0.31.0
  - @stackra/money@0.31.0
  - @stackra/versioning@0.31.0
  - @stackra/model@0.31.0
  - @stackra/testing@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
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
- Updated dependencies [85cd1b5]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [d8d78f0]
- Updated dependencies [7b5a381]
- Updated dependencies [0394e56]
- Updated dependencies [2307506]
- Updated dependencies [d3c8b27]
- Updated dependencies [a426842]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [98a8940]
- Updated dependencies [82dccb3]
- Updated dependencies [7fad9a3]
- Updated dependencies [f6a087c]
- Updated dependencies [98a8940]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [265a3ee]
- Updated dependencies [c8e7592]
- Updated dependencies [11def65]
- Updated dependencies [d3c8b27]
- Updated dependencies [d5a7d0a]
- Updated dependencies [15dba8d]
- Updated dependencies [d3c8b27]
- Updated dependencies [d3c8b27]
  - @stackra/actions@0.30.0
  - @stackra/ui@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/iam@0.30.0
  - @stackra/database@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/experience@0.30.0
  - @stackra/settings@0.30.0
  - @stackra/outbox@0.30.0
  - @stackra/queue@0.30.0
  - @stackra/scheduler@0.30.0
  - @stackra/workflow@0.30.0
  - @stackra/panel@0.30.0
  - @stackra/container@0.30.0
  - @stackra/search@0.30.0
  - @stackra/tenancy@0.30.0
  - @stackra/integrations@0.30.0
  - @stackra/ledger@0.30.0
  - @stackra/money@0.30.0
  - @stackra/versioning@0.30.0
  - @stackra/model@0.30.0
  - @stackra/config@0.30.0
  - @stackra/events@0.30.0
  - @stackra/i18n@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/testing@0.30.0

## 0.29.0

### Patch Changes

- 25b99da: The seed entry (`.stackra/entry/seed.ts`) registers the service's factory pairs with `registerModelPartners`, so a
  demo seeder that uses a factory runs under `stackra db seed`. It also runs the seeders of the packages a service hosts,
  imported from each package's `./testing` entry, before the service's own, and lists every seeder in module-dependency
  order instead of file order (STA-2061).
  
  `stackra.manifest.json` gains two optional sections, `seeders` (key, module, profile, class, file, in module order) and
  `factories` (class, file, model), which a host reads from its dependencies. The committed manifests of
  `@stackra/loyalty-kit` and `@stackra/access-log` now carry them.
- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [4cc17e5]
- Updated dependencies [11a19a7]
- Updated dependencies [1b727b9]
- Updated dependencies [b26036e]
- Updated dependencies [45afd22]
- Updated dependencies [1b88340]
- Updated dependencies [9eb3427]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/integrations@0.29.0
  - @stackra/tenancy@0.29.0
  - @stackra/settings@0.29.0
  - @stackra/workflow@0.29.0
  - @stackra/search@0.29.0
  - @stackra/panel@0.29.0
  - @stackra/outbox@0.29.0
  - @stackra/queue@0.29.0
  - @stackra/scheduler@0.29.0
  - @stackra/iam@0.29.0
  - @stackra/ledger@0.29.0
  - @stackra/money@0.29.0
  - @stackra/versioning@0.29.0
  - @stackra/model@0.29.0
  - @stackra/ui@0.29.0
  - @stackra/experience@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/events@0.29.0
  - @stackra/i18n@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/testing@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/scheduler@0.28.0
  - @stackra/integrations@0.28.0
  - @stackra/database@0.28.0
  - @stackra/search@0.28.0
  - @stackra/panel@0.28.0
  - @stackra/outbox@0.28.0
  - @stackra/queue@0.28.0
  - @stackra/workflow@0.28.0
  - @stackra/iam@0.28.0
  - @stackra/tenancy@0.28.0
  - @stackra/experience@0.28.0
  - @stackra/ledger@0.28.0
  - @stackra/settings@0.28.0
  - @stackra/money@0.28.0
  - @stackra/versioning@0.28.0
  - @stackra/model@0.28.0
  - @stackra/ui@0.28.0
  - @stackra/testing@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/events@0.28.0
  - @stackra/i18n@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [4a4d817]
- Updated dependencies [df74e1d]
- Updated dependencies [8a70552]
- Updated dependencies [7d284f2]
- Updated dependencies [5119f3c]
  - @stackra/database@0.27.0
  - @stackra/integrations@0.27.0
  - @stackra/outbox@0.27.0
  - @stackra/workflow@0.27.0
  - @stackra/ledger@0.27.0
  - @stackra/search@0.27.0
  - @stackra/panel@0.27.0
  - @stackra/queue@0.27.0
  - @stackra/scheduler@0.27.0
  - @stackra/iam@0.27.0
  - @stackra/tenancy@0.27.0
  - @stackra/settings@0.27.0
  - @stackra/experience@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/money@0.27.0
  - @stackra/versioning@0.27.0
  - @stackra/model@0.27.0
  - @stackra/ui@0.27.0
  - @stackra/testing@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/events@0.27.0
  - @stackra/i18n@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- 9b02a7c: A host binds the actions and queries of each package module it hosts, as it does that package's services: they are
  the module's surface, so a test or a client can call one by class (`run(EnrollMemberAction, …)`) without a host class
  injecting it. A published package's manifest lists its actions and queries in `services` with their constructor
  tokens, and the host wiring binds each one with them.
- Updated dependencies [93e358e]
- Updated dependencies [9b02a7c]
- Updated dependencies [ceceef3]
- Updated dependencies [9cee75d]
- Updated dependencies [a9f21b6]
- Updated dependencies [e5da198]
- Updated dependencies [031a1f7]
- Updated dependencies [9d0dd67]
- Updated dependencies [0341ef1]
  - @stackra/database@0.26.0
  - @stackra/tenancy@0.26.0
  - @stackra/integrations@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/iam@0.26.0
  - @stackra/ui@0.26.0
  - @stackra/workflow@0.26.0
  - @stackra/ledger@0.26.0
  - @stackra/search@0.26.0
  - @stackra/panel@0.26.0
  - @stackra/outbox@0.26.0
  - @stackra/queue@0.26.0
  - @stackra/scheduler@0.26.0
  - @stackra/settings@0.26.0
  - @stackra/experience@0.26.0
  - @stackra/money@0.26.0
  - @stackra/versioning@0.26.0
  - @stackra/model@0.26.0
  - @stackra/testing@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/events@0.26.0
  - @stackra/i18n@0.26.0
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
  - @stackra/tenancy@0.25.0
  - @stackra/workflow@0.25.0
  - @stackra/ledger@0.25.0
  - @stackra/search@0.25.0
  - @stackra/panel@0.25.0
  - @stackra/outbox@0.25.0
  - @stackra/queue@0.25.0
  - @stackra/scheduler@0.25.0
  - @stackra/iam@0.25.0
  - @stackra/settings@0.25.0
  - @stackra/integrations@0.25.0
  - @stackra/experience@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/money@0.25.0
  - @stackra/versioning@0.25.0
  - @stackra/model@0.25.0
  - @stackra/ui@0.25.0
  - @stackra/testing@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/events@0.25.0
  - @stackra/i18n@0.25.0
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
  - @stackra/integrations@0.24.0
  - @stackra/search@0.24.0
  - @stackra/panel@0.24.0
  - @stackra/outbox@0.24.0
  - @stackra/queue@0.24.0
  - @stackra/scheduler@0.24.0
  - @stackra/iam@0.24.0
  - @stackra/tenancy@0.24.0
  - @stackra/ledger@0.24.0
  - @stackra/settings@0.24.0
  - @stackra/experience@0.24.0
  - @stackra/money@0.24.0
  - @stackra/versioning@0.24.0
  - @stackra/model@0.24.0
  - @stackra/ui@0.24.0
  - @stackra/testing@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/events@0.24.0
  - @stackra/i18n@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- 8b42c02: A published package's manifest lists its extension points in `services`, beside the services that inject them, so a
  host's wiring binds them. Commerce customers injects `AccountService` from `@stackra/loyalty-kit`, whose
  `LoyaltyKitExtensionPoint` had no binding and failed with `UnboundTokenError`.
- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [d002763]
- Updated dependencies [c0237a4]
- Updated dependencies [1083617]
- Updated dependencies [6edeee4]
- Updated dependencies [1d76993]
- Updated dependencies [12f4836]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
- Updated dependencies [fb6e2b3]
- Updated dependencies [12f4836]
- Updated dependencies [dee48f0]
  - @stackra/database@0.23.0
  - @stackra/integrations@0.23.0
  - @stackra/tenancy@0.23.0
  - @stackra/ui@0.23.0
  - @stackra/search@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/settings@0.23.0
  - @stackra/workflow@0.23.0
  - @stackra/ledger@0.23.0
  - @stackra/panel@0.23.0
  - @stackra/outbox@0.23.0
  - @stackra/queue@0.23.0
  - @stackra/scheduler@0.23.0
  - @stackra/iam@0.23.0
  - @stackra/experience@0.23.0
  - @stackra/money@0.23.0
  - @stackra/versioning@0.23.0
  - @stackra/model@0.23.0
  - @stackra/testing@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/events@0.23.0
  - @stackra/i18n@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- 3a9a6be: `@stackra/integrations` is a peer of every library that uses its values (payments, webhooks, documents, notifications,
  pricing, achievements, loyalty-kit), no longer a dependency. As a dependency, pnpm resolved a second copy in a product,
  so a Connection's base and `makeConnection` came from different copies and every Stripe call failed with "StripeConnection
  was not loaded by a ConnectionStore". `stackra validate` refuses the mistake (`hosted-peers`, `HOSTED_PEER_PACKAGES`).
- Updated dependencies [41f3da5]
- Updated dependencies [b394912]
- Updated dependencies [786848c]
- Updated dependencies [ae24e3c]
- Updated dependencies [acbee14]
- Updated dependencies [227dd7a]
- Updated dependencies [940e198]
  - @stackra/integrations@0.22.0
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/tenancy@0.22.0
  - @stackra/events@0.22.0
  - @stackra/ledger@0.22.0
  - @stackra/search@0.22.0
  - @stackra/panel@0.22.0
  - @stackra/outbox@0.22.0
  - @stackra/queue@0.22.0
  - @stackra/scheduler@0.22.0
  - @stackra/workflow@0.22.0
  - @stackra/iam@0.22.0
  - @stackra/settings@0.22.0
  - @stackra/experience@0.22.0
  - @stackra/versioning@0.22.0
  - @stackra/model@0.22.0
  - @stackra/money@0.22.0
  - @stackra/ui@0.22.0
  - @stackra/testing@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/i18n@0.22.0
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
  - @stackra/ledger@0.21.0
  - @stackra/money@0.21.0
  - @stackra/integrations@0.21.0
  - @stackra/versioning@0.21.0
  - @stackra/ui@0.21.0
  - @stackra/experience@0.21.0
  - @stackra/panel@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/events@0.21.0
  - @stackra/i18n@0.21.0
  - @stackra/outbox@0.21.0
  - @stackra/queue@0.21.0
  - @stackra/workflow@0.21.0
  - @stackra/iam@0.21.0
  - @stackra/settings@0.21.0
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
  - @stackra/integrations@0.20.0
  - @stackra/search@0.20.0
  - @stackra/panel@0.20.0
  - @stackra/outbox@0.20.0
  - @stackra/queue@0.20.0
  - @stackra/scheduler@0.20.0
  - @stackra/iam@0.20.0
  - @stackra/tenancy@0.20.0
  - @stackra/ledger@0.20.0
  - @stackra/settings@0.20.0
  - @stackra/money@0.20.0
  - @stackra/versioning@0.20.0
  - @stackra/model@0.20.0
  - @stackra/ui@0.20.0
  - @stackra/experience@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/events@0.20.0
  - @stackra/i18n@0.20.0
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
- 0e0de4f: Step-up for the L3 and L4 user actions STA-2096 raised (STA-340):
  
  - `@stackra/actions`: `stepUp` also takes `{ exempt: "first-factor-enrolment" }`, for which the pipeline asks no
    `StepUpCheck`; the action enforces its own rule.
  - `@stackra/gen`: refuses the exemption on any action outside `FIRST_FACTOR_ENROLMENT_ACTIONS`
    (`step_up_exemption_unlisted`).
  - `@stackra/identity`: `identity.passkey.confirm` takes the exemption. A first strong factor needs a fresh sign-in;
    once the user has one, a new passkey needs AAL2. Each enrolment is audited with `firstFactor`.
  - `@stackra/loyalty-kit`: `points.redeem` and `points.confirm_redemption` need AAL2 from a user. `points.earn_visit` is
    service-only and loses its `POST /loyalty/visits` endpoint: call it from the till or booking service.

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
- Updated dependencies [3833180]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/queue@0.19.0
  - @stackra/iam@0.19.0
  - @stackra/workflow@0.19.0
  - @stackra/tenancy@0.19.0
  - @stackra/panel@0.19.0
  - @stackra/database@0.19.0
  - @stackra/config@0.19.0
  - @stackra/integrations@0.19.0
  - @stackra/search@0.19.0
  - @stackra/ledger@0.19.0
  - @stackra/money@0.19.0
  - @stackra/versioning@0.19.0
  - @stackra/model@0.19.0
  - @stackra/ui@0.19.0
  - @stackra/experience@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/events@0.19.0
  - @stackra/i18n@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/outbox@0.19.0
  - @stackra/scheduler@0.19.0
  - @stackra/settings@0.19.0
  - @stackra/testing@0.19.0

## 0.18.1

### Patch Changes

- @stackra/scheduler@0.18.1
  - @stackra/tenancy@0.18.1
  - @stackra/panel@0.18.1
  - @stackra/workflow@0.18.1
  - @stackra/iam@0.18.1
  - @stackra/integrations@0.18.1
  - @stackra/experience@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/ledger@0.18.1
  - @stackra/money@0.18.1
  - @stackra/versioning@0.18.1
  - @stackra/database@0.18.1
  - @stackra/model@0.18.1
  - @stackra/search@0.18.1
  - @stackra/ui@0.18.1
  - @stackra/testing@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/events@0.18.1
  - @stackra/i18n@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/outbox@0.18.1
  - @stackra/queue@0.18.1
  - @stackra/settings@0.18.1

## 0.18.0

### Patch Changes

- @stackra/scheduler@0.18.0
  - @stackra/tenancy@0.18.0
  - @stackra/panel@0.18.0
  - @stackra/workflow@0.18.0
  - @stackra/iam@0.18.0
  - @stackra/integrations@0.18.0
  - @stackra/experience@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/ledger@0.18.0
  - @stackra/money@0.18.0
  - @stackra/versioning@0.18.0
  - @stackra/database@0.18.0
  - @stackra/model@0.18.0
  - @stackra/search@0.18.0
  - @stackra/ui@0.18.0
  - @stackra/testing@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/events@0.18.0
  - @stackra/i18n@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/outbox@0.18.0
  - @stackra/queue@0.18.0
  - @stackra/settings@0.18.0

## 0.17.2

### Patch Changes

- @stackra/scheduler@0.17.2
  - @stackra/tenancy@0.17.2
  - @stackra/panel@0.17.2
  - @stackra/workflow@0.17.2
  - @stackra/iam@0.17.2
  - @stackra/integrations@0.17.2
  - @stackra/experience@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/ledger@0.17.2
  - @stackra/money@0.17.2
  - @stackra/versioning@0.17.2
  - @stackra/database@0.17.2
  - @stackra/model@0.17.2
  - @stackra/search@0.17.2
  - @stackra/ui@0.17.2
  - @stackra/testing@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/events@0.17.2
  - @stackra/i18n@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/outbox@0.17.2
  - @stackra/queue@0.17.2
  - @stackra/settings@0.17.2

## 0.17.1

### Patch Changes

- @stackra/integrations@0.17.1
  - @stackra/settings@0.17.1
  - @stackra/workflow@0.17.1
  - @stackra/iam@0.17.1
  - @stackra/search@0.17.1
  - @stackra/panel@0.17.1
  - @stackra/experience@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/ledger@0.17.1
  - @stackra/money@0.17.1
  - @stackra/versioning@0.17.1
  - @stackra/database@0.17.1
  - @stackra/model@0.17.1
  - @stackra/ui@0.17.1
  - @stackra/testing@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/events@0.17.1
  - @stackra/i18n@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/outbox@0.17.1
  - @stackra/queue@0.17.1
  - @stackra/scheduler@0.17.1
  - @stackra/tenancy@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/ledger@0.17.0
  - @stackra/money@0.17.0
  - @stackra/integrations@0.17.0
  - @stackra/versioning@0.17.0
  - @stackra/database@0.17.0
  - @stackra/model@0.17.0
  - @stackra/search@0.17.0
  - @stackra/ui@0.17.0
  - @stackra/testing@0.17.0
  - @stackra/experience@0.17.0
  - @stackra/panel@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/events@0.17.0
  - @stackra/i18n@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/outbox@0.17.0
  - @stackra/queue@0.17.0
  - @stackra/scheduler@0.17.0
  - @stackra/workflow@0.17.0
  - @stackra/iam@0.17.0
  - @stackra/tenancy@0.17.0
  - @stackra/settings@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [c6e4715]
- Updated dependencies [5bf8ad3]
  - @stackra/settings@0.16.0
  - @stackra/validation@0.16.0
  - @stackra/scheduler@0.16.0
  - @stackra/search@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/integrations@0.16.0
  - @stackra/versioning@0.16.0
  - @stackra/database@0.16.0
  - @stackra/model@0.16.0
  - @stackra/ui@0.16.0
  - @stackra/experience@0.16.0
  - @stackra/panel@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/events@0.16.0
  - @stackra/i18n@0.16.0
  - @stackra/outbox@0.16.0
  - @stackra/queue@0.16.0
  - @stackra/workflow@0.16.0
  - @stackra/iam@0.16.0
  - @stackra/tenancy@0.16.0
  - @stackra/ledger@0.16.0
  - @stackra/money@0.16.0
  - @stackra/testing@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [0b0cf51]
  - @stackra/outbox@0.15.0
  - @stackra/experience@0.15.0
  - @stackra/panel@0.15.0
  - @stackra/search@0.15.0
  - @stackra/workflow@0.15.0
  - @stackra/integrations@0.15.0
  - @stackra/iam@0.15.0
  - @stackra/tenancy@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/ledger@0.15.0
  - @stackra/money@0.15.0
  - @stackra/versioning@0.15.0
  - @stackra/database@0.15.0
  - @stackra/model@0.15.0
  - @stackra/ui@0.15.0
  - @stackra/testing@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/events@0.15.0
  - @stackra/i18n@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/queue@0.15.0
  - @stackra/scheduler@0.15.0
  - @stackra/settings@0.15.0

## 0.14.4

### Patch Changes

- Updated dependencies [1f55b7a]
- Updated dependencies [6406843]
- Updated dependencies [cc150d2]
  - @stackra/panel@0.14.4
  - @stackra/settings@0.14.4
  - @stackra/search@0.14.4
  - @stackra/integrations@0.14.4
  - @stackra/experience@0.14.4
  - @stackra/workflow@0.14.4
  - @stackra/iam@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/ledger@0.14.4
  - @stackra/money@0.14.4
  - @stackra/versioning@0.14.4
  - @stackra/database@0.14.4
  - @stackra/model@0.14.4
  - @stackra/ui@0.14.4
  - @stackra/testing@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/events@0.14.4
  - @stackra/i18n@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/outbox@0.14.4
  - @stackra/queue@0.14.4
  - @stackra/scheduler@0.14.4
  - @stackra/tenancy@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/ledger@0.14.3
  - @stackra/money@0.14.3
  - @stackra/integrations@0.14.3
  - @stackra/versioning@0.14.3
  - @stackra/database@0.14.3
  - @stackra/model@0.14.3
  - @stackra/search@0.14.3
  - @stackra/ui@0.14.3
  - @stackra/testing@0.14.3
  - @stackra/experience@0.14.3
  - @stackra/panel@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/events@0.14.3
  - @stackra/i18n@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/outbox@0.14.3
  - @stackra/queue@0.14.3
  - @stackra/scheduler@0.14.3
  - @stackra/workflow@0.14.3
  - @stackra/iam@0.14.3
  - @stackra/tenancy@0.14.3
  - @stackra/settings@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/ledger@0.14.2
  - @stackra/money@0.14.2
  - @stackra/integrations@0.14.2
  - @stackra/versioning@0.14.2
  - @stackra/database@0.14.2
  - @stackra/model@0.14.2
  - @stackra/search@0.14.2
  - @stackra/ui@0.14.2
  - @stackra/experience@0.14.2
  - @stackra/panel@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/events@0.14.2
  - @stackra/i18n@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/outbox@0.14.2
  - @stackra/queue@0.14.2
  - @stackra/scheduler@0.14.2
  - @stackra/workflow@0.14.2
  - @stackra/iam@0.14.2
  - @stackra/tenancy@0.14.2
  - @stackra/settings@0.14.2
  - @stackra/testing@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/ledger@0.14.1
  - @stackra/money@0.14.1
  - @stackra/integrations@0.14.1
  - @stackra/versioning@0.14.1
  - @stackra/database@0.14.1
  - @stackra/model@0.14.1
  - @stackra/search@0.14.1
  - @stackra/ui@0.14.1
  - @stackra/testing@0.14.1
  - @stackra/experience@0.14.1
  - @stackra/panel@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/events@0.14.1
  - @stackra/i18n@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/outbox@0.14.1
  - @stackra/queue@0.14.1
  - @stackra/scheduler@0.14.1
  - @stackra/workflow@0.14.1
  - @stackra/iam@0.14.1
  - @stackra/tenancy@0.14.1
  - @stackra/settings@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/ledger@0.14.0
  - @stackra/money@0.14.0
  - @stackra/integrations@0.14.0
  - @stackra/versioning@0.14.0
  - @stackra/database@0.14.0
  - @stackra/model@0.14.0
  - @stackra/search@0.14.0
  - @stackra/ui@0.14.0
  - @stackra/testing@0.14.0
  - @stackra/experience@0.14.0
  - @stackra/panel@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/events@0.14.0
  - @stackra/i18n@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/outbox@0.14.0
  - @stackra/queue@0.14.0
  - @stackra/scheduler@0.14.0
  - @stackra/workflow@0.14.0
  - @stackra/iam@0.14.0
  - @stackra/tenancy@0.14.0
  - @stackra/settings@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/ledger@0.13.0
  - @stackra/money@0.13.0
  - @stackra/integrations@0.13.0
  - @stackra/versioning@0.13.0
  - @stackra/database@0.13.0
  - @stackra/model@0.13.0
  - @stackra/search@0.13.0
  - @stackra/ui@0.13.0
  - @stackra/testing@0.13.0
  - @stackra/experience@0.13.0
  - @stackra/panel@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/events@0.13.0
  - @stackra/i18n@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/outbox@0.13.0
  - @stackra/queue@0.13.0
  - @stackra/scheduler@0.13.0
  - @stackra/workflow@0.13.0
  - @stackra/iam@0.13.0
  - @stackra/tenancy@0.13.0
  - @stackra/settings@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/ledger@0.12.0
  - @stackra/money@0.12.0
  - @stackra/integrations@0.12.0
  - @stackra/versioning@0.12.0
  - @stackra/database@0.12.0
  - @stackra/model@0.12.0
  - @stackra/search@0.12.0
  - @stackra/ui@0.12.0
  - @stackra/testing@0.12.0
  - @stackra/experience@0.12.0
  - @stackra/panel@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/events@0.12.0
  - @stackra/i18n@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/outbox@0.12.0
  - @stackra/queue@0.12.0
  - @stackra/scheduler@0.12.0
  - @stackra/workflow@0.12.0
  - @stackra/iam@0.12.0
  - @stackra/tenancy@0.12.0
  - @stackra/settings@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/ledger@0.11.1
  - @stackra/money@0.11.1
  - @stackra/integrations@0.11.1
  - @stackra/versioning@0.11.1
  - @stackra/database@0.11.1
  - @stackra/model@0.11.1
  - @stackra/search@0.11.1
  - @stackra/ui@0.11.1
  - @stackra/testing@0.11.1
  - @stackra/experience@0.11.1
  - @stackra/panel@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/events@0.11.1
  - @stackra/i18n@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/outbox@0.11.1
  - @stackra/queue@0.11.1
  - @stackra/scheduler@0.11.1
  - @stackra/workflow@0.11.1
  - @stackra/iam@0.11.1
  - @stackra/tenancy@0.11.1
  - @stackra/settings@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/ledger@0.11.0
  - @stackra/money@0.11.0
  - @stackra/integrations@0.11.0
  - @stackra/versioning@0.11.0
  - @stackra/database@0.11.0
  - @stackra/model@0.11.0
  - @stackra/search@0.11.0
  - @stackra/ui@0.11.0
  - @stackra/testing@0.11.0
  - @stackra/experience@0.11.0
  - @stackra/panel@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/events@0.11.0
  - @stackra/i18n@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/outbox@0.11.0
  - @stackra/queue@0.11.0
  - @stackra/scheduler@0.11.0
  - @stackra/workflow@0.11.0
  - @stackra/iam@0.11.0
  - @stackra/tenancy@0.11.0
  - @stackra/settings@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/scheduler@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/integrations@0.10.0
  - @stackra/search@0.10.0
  - @stackra/ui@0.10.0
  - @stackra/panel@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/i18n@0.10.0
  - @stackra/outbox@0.10.0
  - @stackra/queue@0.10.0
  - @stackra/workflow@0.10.0
  - @stackra/tenancy@0.10.0
  - @stackra/settings@0.10.0
  - @stackra/ledger@0.10.0
  - @stackra/money@0.10.0
  - @stackra/versioning@0.10.0
  - @stackra/model@0.10.0
  - @stackra/experience@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/iam@0.10.0
  - @stackra/testing@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [681d01a]
- Updated dependencies [681d01a]
- Updated dependencies [2e43c48]
- Updated dependencies [b174a17]
- Updated dependencies [681d01a]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/panel@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/model@0.9.0
  - @stackra/ui@0.9.0
  - @stackra/container@0.9.0
  - @stackra/scheduler@0.9.0
  - @stackra/database@0.9.0
  - @stackra/queue@0.9.0
  - @stackra/tenancy@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/integrations@0.9.0
  - @stackra/versioning@0.9.0
  - @stackra/search@0.9.0
  - @stackra/experience@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/events@0.9.0
  - @stackra/i18n@0.9.0
  - @stackra/outbox@0.9.0
  - @stackra/workflow@0.9.0
  - @stackra/iam@0.9.0
  - @stackra/settings@0.9.0
  - @stackra/ledger@0.9.0
  - @stackra/money@0.9.0
  - @stackra/testing@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/scheduler@0.8.0
  - @stackra/ledger@0.8.0
  - @stackra/search@0.8.0
  - @stackra/panel@0.8.0
  - @stackra/outbox@0.8.0
  - @stackra/queue@0.8.0
  - @stackra/workflow@0.8.0
  - @stackra/iam@0.8.0
  - @stackra/tenancy@0.8.0
  - @stackra/settings@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/money@0.8.0
  - @stackra/integrations@0.8.0
  - @stackra/versioning@0.8.0
  - @stackra/model@0.8.0
  - @stackra/ui@0.8.0
  - @stackra/experience@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/events@0.8.0
  - @stackra/i18n@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/testing@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/scheduler@0.7.1
  - @stackra/tenancy@0.7.1
  - @stackra/panel@0.7.1
  - @stackra/workflow@0.7.1
  - @stackra/iam@0.7.1
  - @stackra/integrations@0.7.1
  - @stackra/experience@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/ledger@0.7.1
  - @stackra/money@0.7.1
  - @stackra/versioning@0.7.1
  - @stackra/database@0.7.1
  - @stackra/model@0.7.1
  - @stackra/search@0.7.1
  - @stackra/ui@0.7.1
  - @stackra/testing@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/events@0.7.1
  - @stackra/i18n@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/outbox@0.7.1
  - @stackra/queue@0.7.1
  - @stackra/settings@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [1f5bf76]
- Updated dependencies [1f5bf76]
- Updated dependencies [1f5bf76]
  - @stackra/iam@0.7.0
  - @stackra/settings@0.7.0
  - @stackra/tenancy@0.7.0
  - @stackra/panel@0.7.0
  - @stackra/search@0.7.0
  - @stackra/integrations@0.7.0
  - @stackra/experience@0.7.0
  - @stackra/workflow@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/ledger@0.7.0
  - @stackra/money@0.7.0
  - @stackra/versioning@0.7.0
  - @stackra/database@0.7.0
  - @stackra/model@0.7.0
  - @stackra/ui@0.7.0
  - @stackra/testing@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/events@0.7.0
  - @stackra/i18n@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/outbox@0.7.0
  - @stackra/queue@0.7.0
  - @stackra/scheduler@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/ledger@0.6.1
  - @stackra/money@0.6.1
  - @stackra/integrations@0.6.1
  - @stackra/versioning@0.6.1
  - @stackra/database@0.6.1
  - @stackra/model@0.6.1
  - @stackra/search@0.6.1
  - @stackra/ui@0.6.1
  - @stackra/testing@0.6.1
  - @stackra/experience@0.6.1
  - @stackra/panel@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/events@0.6.1
  - @stackra/i18n@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/outbox@0.6.1
  - @stackra/queue@0.6.1
  - @stackra/scheduler@0.6.1
  - @stackra/workflow@0.6.1
  - @stackra/iam@0.6.1
  - @stackra/tenancy@0.6.1
  - @stackra/settings@0.6.1

## 0.6.0

### Patch Changes

- e15d9c3: Gen records every panel resource in the manifest's `ui.resources`, under `<module>.<model>`: the tree its builder
  members return, with its owning `module`, its `class` and, in a package, the `from` a host imports it from. Action
  and query classes in the tree are written as their locked keys, and a service or app also lists its hosted packages'
  resources. `generate` takes a `loader` to run the resource classes; `stackra gen` passes one on Vite's module runner,
  and a run without one refuses a member that declares a resource (`resource_loader_missing`). New refusals:
  `resource_unloadable`, `builder_impure`, `resource_operation_unknown` and `resource_duplicate` (STA-1947). The loyalty
  kit's manifest now records its `LoyaltyAccountResource`.
- Updated dependencies [fb29d41]
- Updated dependencies [e250d4f]
- Updated dependencies [c64a55d]
- Updated dependencies [d53d9d3]
- Updated dependencies [712fb89]
  - @stackra/database@0.6.0
  - @stackra/iam@0.6.0
  - @stackra/tenancy@0.6.0
  - @stackra/ui@0.6.0
  - @stackra/queue@0.6.0
  - @stackra/ledger@0.6.0
  - @stackra/search@0.6.0
  - @stackra/panel@0.6.0
  - @stackra/outbox@0.6.0
  - @stackra/scheduler@0.6.0
  - @stackra/workflow@0.6.0
  - @stackra/settings@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/money@0.6.0
  - @stackra/integrations@0.6.0
  - @stackra/versioning@0.6.0
  - @stackra/model@0.6.0
  - @stackra/testing@0.6.0
  - @stackra/experience@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/events@0.6.0
  - @stackra/i18n@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/ledger@0.5.1
  - @stackra/search@0.5.1
  - @stackra/panel@0.5.1
  - @stackra/outbox@0.5.1
  - @stackra/queue@0.5.1
  - @stackra/scheduler@0.5.1
  - @stackra/workflow@0.5.1
  - @stackra/iam@0.5.1
  - @stackra/tenancy@0.5.1
  - @stackra/settings@0.5.1
  - @stackra/integrations@0.5.1
  - @stackra/experience@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/money@0.5.1
  - @stackra/versioning@0.5.1
  - @stackra/model@0.5.1
  - @stackra/ui@0.5.1
  - @stackra/testing@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/events@0.5.1
  - @stackra/i18n@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [d7f72d3]
- Updated dependencies [104d9f4]
- Updated dependencies [d7f72d3]
  - @stackra/i18n@0.5.0
  - @stackra/tenancy@0.5.0
  - @stackra/ui@0.5.0
  - @stackra/search@0.5.0
  - @stackra/experience@0.5.0
  - @stackra/panel@0.5.0
  - @stackra/workflow@0.5.0
  - @stackra/settings@0.5.0
  - @stackra/integrations@0.5.0
  - @stackra/iam@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/ledger@0.5.0
  - @stackra/money@0.5.0
  - @stackra/versioning@0.5.0
  - @stackra/database@0.5.0
  - @stackra/model@0.5.0
  - @stackra/testing@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/events@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/outbox@0.5.0
  - @stackra/queue@0.5.0
  - @stackra/scheduler@0.5.0

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
- Updated dependencies [bb08f25]
- Updated dependencies [1856ee0]
- Updated dependencies [70e6c17]
- Updated dependencies [5f63e58]
- Updated dependencies [5fc0db7]
- Updated dependencies [36dbd49]
- Updated dependencies [b5ae8a4]
- Updated dependencies [d0fa2f8]
- Updated dependencies [2bcee04]
- Updated dependencies [1a3bc4d]
- Updated dependencies [298d942]
- Updated dependencies [08bd3f9]
- Updated dependencies [8f2c40a]
- Updated dependencies [3953e1a]
- Updated dependencies [9f48901]
- Updated dependencies [c19730d]
- Updated dependencies [b8d8554]
- Updated dependencies [5d60d4a]
- Updated dependencies [a1229d0]
- Updated dependencies [39f8662]
- Updated dependencies [b970c98]
- Updated dependencies [2bbc0e8]
- Updated dependencies [9574c22]
- Updated dependencies [f490040]
- Updated dependencies [2f5ab1e]
- Updated dependencies [dbb60dc]
- Updated dependencies [1856ee0]
- Updated dependencies [dedaa81]
- Updated dependencies [a7eaed4]
- Updated dependencies [149ca06]
- Updated dependencies [1567384]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/panel@0.4.0
  - @stackra/workflow@0.4.0
  - @stackra/settings@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/tenancy@0.4.0
  - @stackra/queue@0.4.0
  - @stackra/container@0.4.0
  - @stackra/events@0.4.0
  - @stackra/iam@0.4.0
  - @stackra/integrations@0.4.0
  - @stackra/outbox@0.4.0
  - @stackra/search@0.4.0
  - @stackra/model@0.4.0
  - @stackra/ui@0.4.0
  - @stackra/scheduler@0.4.0
  - @stackra/versioning@0.4.0
  - @stackra/experience@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/i18n@0.4.0
  - @stackra/ledger@0.4.0
  - @stackra/money@0.4.0
  - @stackra/testing@0.4.0

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
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
- Updated dependencies [869d976]
- Updated dependencies [4a6abd7]
- Updated dependencies [895a526]
- Updated dependencies [a60f4e9]
- Updated dependencies [9ed272a]
- Updated dependencies [ccc0b0f]
- Updated dependencies [7053c20]
- Updated dependencies [a60f4e9]
- Updated dependencies [f05c8e5]
- Updated dependencies [a60f4e9]
- Updated dependencies [9ed272a]
- Updated dependencies [6484453]
- Updated dependencies [a60f4e9]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/events@0.3.0
  - @stackra/experience@0.3.0
  - @stackra/i18n@0.3.0
  - @stackra/iam@0.3.0
  - @stackra/integrations@0.3.0
  - @stackra/ledger@0.3.0
  - @stackra/model@0.3.0
  - @stackra/money@0.3.0
  - @stackra/outbox@0.3.0
  - @stackra/panel@0.3.0
  - @stackra/queue@0.3.0
  - @stackra/scheduler@0.3.0
  - @stackra/search@0.3.0
  - @stackra/settings@0.3.0
  - @stackra/tenancy@0.3.0
  - @stackra/testing@0.3.0
  - @stackra/ui@0.3.0
  - @stackra/validation@0.3.0
  - @stackra/versioning@0.3.0
  - @stackra/workflow@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
- Updated dependencies [6f3536e]
- Updated dependencies [9558710]
- Updated dependencies [eb69aa6]
- Updated dependencies [eb37de7]
- Updated dependencies [c4f295e]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/iam@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/panel@0.2.0
  - @stackra/ui@0.2.0
  - @stackra/integrations@0.2.0
  - @stackra/search@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/queue@0.2.0
  - @stackra/scheduler@0.2.0
  - @stackra/workflow@0.2.0
  - @stackra/tenancy@0.2.0
  - @stackra/ledger@0.2.0
  - @stackra/settings@0.2.0
  - @stackra/versioning@0.2.0
  - @stackra/experience@0.2.0
  - @stackra/money@0.2.0
  - @stackra/model@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/i18n@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- fa0ed99: `LoyaltyCardPass` (`Pass({ key: "loyalty_card" })`) and `LoyaltyCardPassSource` in `./node`: the loyalty card wallet
  pass content (programme name, balance, tier, account id as serial and QR code, brand colours and logo), with
  `passes.loyalty_card.*` labels in seven locales (new de, es, fr, it, nl lang files). New dependency:
  `@stackra/integrations`.
- 2787c1e: Add `@stackra/loyalty-kit`, the golden capability kit on `@stackra/ledger`: points accounts, tiers, earning and
  redemption behind the `LoyaltyLedger` and `LoyaltyMembers` ports, memory and Postgres ledgers whose expiry is cut at
  zero, the loyalty account permissions and policy, the module's actions and queries (each naming its permission), the
  undoable redemption workflow with its confirmation signal, versioned events, extension point, settings and migrations,
  the panel resource, overview dashboard and two widgets, web and native renderers, and the members fake, points fixture
  and balance matcher.
- f1b9c64: `PartiesLoyaltyMembersDriver` (STA-804): the `LoyaltyMembers` answer over the OS parties service. An OS host subclasses
  it with its generated `PartiesClient`; a live person (`parties.person.get@1`) is a member, an unknown, merged-away or
  erased one is not, and any other failure throws so a redemption fails closed.
- fadd825: Programme and tier hook (ADR 0454): the `isActive` and `earnPerMinor` settings (a paused programme earns nothing; the
  earn rate is per scope), `LoyaltyService.quoteEarn` takes the scope's rate, the `LoyaltyTierPolicy` port with the
  `threshold` driver behind `RecalculateTierListener` (a host replaces it with `@Replaces`), `PointsRedeemed` is now the
  integration event `loyalty_kit.points.redeemed.v1` with `balanceAfter`, and the new `PointsExpired`
  (`loyalty_kit.points.expired.v1`) is recorded by the expiry job. `AccountService` now takes a `SettingsReader`.
- 48e9fed: The point value and the redemption cap are settings (`loyalty_kit.pointValueMinor`, `loyalty_kit.maxRedeemPercent`,
  approval required), and config `earnPerMinor`, `pointValueMinor` and `maxRedeemPercent` are removed (breaking for a host
  that overrode them in config: set them as settings instead). `LoyaltyService` no longer takes the config:
  `quote(member, requested, totalMinor, rates)`, `quoteEarn(amountMinor, earnPerMinor)` and `pointsFor(amountMinor,
  pointValueMinor)` take the scope's values, and `RedeemPointsWorkflow` reads them from `LoyaltyKitSettings`. New
  `AccountService.takeBack(member, points, reference)` (a covered `adjust` debit cut at the balance, once per reference,
  `loyalty_kit.points.taken_back.v1`) and `AccountService.importBalance(member, { points, reference, tier? })` (an exact
  `earn` entry under `import:`, tier raised only, `loyalty_kit.points.imported.v1`), with the `RedemptionRates` and
  `PointsImport` types and the `TAKE_BACK_REFERENCE_PREFIX` and `IMPORT_REFERENCE_PREFIX` constants (STA-1323).
- 4d4eb5a: Add stamp cards (earning by visit count): `AccountService.earnVisit`, `EarnVisitAction`
  (`loyalty_kit.points.earn_visit@1`) with its input and output, `stampCardProgress`, the `stamp` permission, and the
  `stampsPerVisit` and `stampsPerCard` settings.
- 8249be0: `MoneyAmount` and `CurrencyCode` in place of bare minor-unit pairs (STA-1383). Breaking:
  
  - `@stackra/loyalty-kit/contracts`: `EarnRequest` and `EarnDraft` take `amount: MoneyAmount` instead of `amountMinor`
    and `currency`; `RedemptionQuote` returns `amount: MoneyAmount` instead of `amountMinor`; `LoyaltyService.quote`
    takes `total: MoneyAmount` instead of `totalMinor`. The stored redeem input and output schemas keep `totalMinor` and
    `amountMinor`; the workflow maps at that boundary with the run's currency.
  - `@stackra/registry`: `computePartnerPayout` takes a `MoneyAmount` gross and returns `{ gross, fee, net }` amounts;
    `PerkListingCharge` carries `amount: MoneyAmount` instead of `currency` and `amountMinor`. The stored `PartnerPayout`
    and `FeeSchedule` records keep their columns.
  - `@stackra/ledger`: `JournalEntry.currency` is a `CurrencyCode`; the amount stays a number so points journals work.
  
  loyalty-kit, registry and ledger now depend on `@stackra/money`.

### Patch Changes

- 5ae13cb: Each `AppendOnly` model's table now has a migration that calls `t.appendOnly()` (STA-1413), so `UPDATE` is revoked
  from `public` and the service's role and gen's `append_only_not_revoked` check passes: access-log 0003 (access and
  audit log entries), ai 0003 (`messages`, `steps`, `tool_calls`) and loyalty-kit 0003 (`ledger_entries`, exported as
  `AppendOnlyLedgerEntriesMigration`).
- 165fae0: Register the generated report queries (`#stackra/reports`) and search queries (`#stackra/search`) like authored
  queries: each gets its manifest entry, derived endpoint, MCP tool and wiring binding (`reportQueriesOf`,
  `searchQueriesOf`), with the package input and output schemas under the module's `schemas`. The loyalty-kit manifest
  lists its `loyalty_kit.loyalty_account.search@1` query. The manifest records a query's `reads`, so a service's wiring reaches `ReplicaReads` for a hosted
  package's replica query too.
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
- a3d23d9: Rule-gap B-7 (stackra-234): `typescript/explicit-module-boundary-types` at error for packages; apps, workers, tools,
  build scripts, tests, stories and e2e specs are off.
  
  The other packages: no behaviour change. Exported functions and public class members now spell the return type they
  already had: components return `ReactElement` (or `ReactElement | null`), panel overrides their base's node type,
  Pulumi helpers an object type of their resources, and zod factories their schema type. `tableInput` keeps its inferred
  schema type with a reasoned disable.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 9310c51: One document-kind vocabulary and a unique block-node name (STA-1383).
  
  - `@stackra/experience/contracts`: `ExperienceKind` gains `Dashboard` (`dashboard`), after `ThemeSection`.
  - Breaking, `@stackra/panel`: `DocumentKind` is removed; `Document({ kind })` takes `ExperienceKind.Page` or
    `ExperienceKind.Dashboard` from `@stackra/experience/contracts` (same codes).
  - Breaking, `@stackra/panel`: the `BlockNode` type (a panel document's table, widget or custom block) is
    `PanelBlockNode`, so `BlockNode` is only experience's renderer component.
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
- Updated dependencies [072a443]
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
- Updated dependencies [dfa0c6a]
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
- Updated dependencies [e8ab3ca]
- Updated dependencies [2787c1e]
- Updated dependencies [903c2a5]
- Updated dependencies [a57a0df]
- Updated dependencies [3da2dcc]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
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
- Updated dependencies [2ead19c]
- Updated dependencies [a9d39cf]
- Updated dependencies [ae5f6cd]
- Updated dependencies [24671ba]
- Updated dependencies [975a6c1]
- Updated dependencies [865cf77]
- Updated dependencies [90e65ce]
- Updated dependencies [0046fbd]
- Updated dependencies [834d55b]
- Updated dependencies [c2b8ed4]
- Updated dependencies [2787c1e]
- Updated dependencies [47cc2f6]
- Updated dependencies [2432cca]
- Updated dependencies [ffda24c]
- Updated dependencies [fa0ed99]
- Updated dependencies [09823c1]
- Updated dependencies [9277eeb]
- Updated dependencies [dddbbcd]
- Updated dependencies [975a6c1]
- Updated dependencies [2787c1e]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [d8ea8c2]
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
- Updated dependencies [8249be0]
- Updated dependencies [c56d7fe]
- Updated dependencies [2787c1e]
- Updated dependencies [5fe0327]
- Updated dependencies [914465a]
- Updated dependencies [9310c51]
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
- Updated dependencies [4c5af60]
- Updated dependencies [a7961d4]
- Updated dependencies [2787c1e]
- Updated dependencies [aaab926]
- Updated dependencies [9ab18b4]
- Updated dependencies [bf83013]
- Updated dependencies [c758552]
- Updated dependencies [0ad504e]
- Updated dependencies [2e21e6a]
- Updated dependencies [d7c5bf2]
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
- Updated dependencies [56dde43]
- Updated dependencies [786f390]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [69363bf]
- Updated dependencies [9759078]
- Updated dependencies [47554e7]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [a45c902]
- Updated dependencies [2c0ea71]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
- Updated dependencies [1271b88]
- Updated dependencies [ab9cc36]
- Updated dependencies [f04fec9]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [897ef24]
- Updated dependencies [9fa447e]
- Updated dependencies [5ae6115]
- Updated dependencies [d41fc93]
- Updated dependencies [9fa447e]
- Updated dependencies [d44e69c]
- Updated dependencies [9fa447e]
- Updated dependencies [b58ebce]
- Updated dependencies [3f2898c]
- Updated dependencies [9fa447e]
- Updated dependencies [69e90f1]
- Updated dependencies [9fa447e]
- Updated dependencies [1c29328]
- Updated dependencies [57f55b7]
- Updated dependencies [2e21e6a]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [e193feb]
- Updated dependencies [65da65c]
- Updated dependencies [65da65c]
- Updated dependencies [69e90f1]
- Updated dependencies [3f2898c]
- Updated dependencies [69e90f1]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [fc51f13]
- Updated dependencies [c7e6988]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
- Updated dependencies [ad2a950]
- Updated dependencies [fc44266]
- Updated dependencies [2787c1e]
- Updated dependencies [7441e28]
- Updated dependencies [eb2572b]
  - @stackra/actions@0.1.0
  - @stackra/integrations@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/ui@0.1.0
  - @stackra/search@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/versioning@0.1.0
  - @stackra/experience@0.1.0
  - @stackra/panel@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/ledger@0.1.0
  - @stackra/money@0.1.0
  - @stackra/queue@0.1.0
  - @stackra/scheduler@0.1.0
  - @stackra/settings@0.1.0
  - @stackra/tenancy@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0
  - @stackra/workflow@0.1.0

Written by Changesets on release; never edited by hand.
