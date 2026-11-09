# @stackra/webhooks

## 0.32.0

### Patch Changes

- Updated dependencies [9ddce28]
  - @stackra/config@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/integrations@0.32.0
  - @stackra/database@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/queue@0.32.0
  - @stackra/scheduler@0.32.0
  - @stackra/tenancy@0.32.0
  - @stackra/iam@0.32.0
  - @stackra/money@0.32.0
  - @stackra/model@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/support@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/integrations@0.31.0
  - @stackra/queue@0.31.0
  - @stackra/scheduler@0.31.0
  - @stackra/iam@0.31.0
  - @stackra/tenancy@0.31.0
  - @stackra/money@0.31.0
  - @stackra/model@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/events@0.31.0
  - @stackra/support@0.31.0
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

- e1e1b5e: `WebhookReceiver` refuses an event with `WebhookEventIdMissingError` when its signature `idHeader` is missing or empty and no complete `eventId` parts stand in for it, or when its Integration names neither. Such an event used to be keyed by `""`, so the inbox kept only the first one.
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
  - @stackra/scheduler@0.30.0
  - @stackra/container@0.30.0
  - @stackra/tenancy@0.30.0
  - @stackra/integrations@0.30.0
  - @stackra/money@0.30.0
  - @stackra/model@0.30.0
  - @stackra/config@0.30.0
  - @stackra/events@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/support@0.30.0

## 0.29.0

### Minor Changes

- 1b88340: `webhooks.eventId` can name several parts, `{ parts: [{ path }, { header }] }`, joined with `:` into one inbox id, for a provider whose events carry no unique id of their own (an order id plus its state plus the delivery timestamp). The receiver refuses an event whose named part is missing with `WebhookEventIdMissingError` instead of keying it by an empty id, which would have deduplicated every such event as one; this applies to the single `{ path }` form too.

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [4cc17e5]
- Updated dependencies [11a19a7]
- Updated dependencies [45afd22]
- Updated dependencies [1b88340]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/integrations@0.29.0
  - @stackra/tenancy@0.29.0
  - @stackra/queue@0.29.0
  - @stackra/scheduler@0.29.0
  - @stackra/iam@0.29.0
  - @stackra/money@0.29.0
  - @stackra/model@0.29.0
  - @stackra/config@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/events@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/contracts@0.29.0
  - @stackra/support@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/scheduler@0.28.0
  - @stackra/integrations@0.28.0
  - @stackra/database@0.28.0
  - @stackra/queue@0.28.0
  - @stackra/iam@0.28.0
  - @stackra/tenancy@0.28.0
  - @stackra/money@0.28.0
  - @stackra/model@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/events@0.28.0
  - @stackra/support@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- 7d284f2: `WebhookReceiver` parses a verified body by its recipe's `bodyFormat`: `json` (the default) as before, or `form`, an
  `application/x-www-form-urlencoded` body read into percent-decoded string values, which route the event
  (`eventType.path`), key it (`eventId.path`) and create it. A verified form-encoded delivery no longer throws a
  `SyntaxError` before routing. `WebhookSchemeRecipe.bodyFormat` now documents that it governs both the verifier and the
  receiver.
- Updated dependencies [4a4d817]
- Updated dependencies [df74e1d]
- Updated dependencies [7d284f2]
  - @stackra/database@0.27.0
  - @stackra/integrations@0.27.0
  - @stackra/queue@0.27.0
  - @stackra/scheduler@0.27.0
  - @stackra/iam@0.27.0
  - @stackra/tenancy@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/money@0.27.0
  - @stackra/model@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/events@0.27.0
  - @stackra/support@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Minor Changes

- 031a1f7: `keyed_field_digest` takes four optional recipe fields, each defaulting to today's behaviour so existing recipes are
  unchanged: `secretAt: "start" | "end"` (default `end`), `separator` (default nothing), `algorithm` now also `SHA-1`,
  and `bodyFormat: "json" | "form"` (default `json`), where a form body is read as
  `application/x-www-form-urlencoded` with its values percent-decoded. A missing value is an empty string.
  `WebhookSchemeRecipe` gains the fields.
- 9d0dd67: A new `labelled_field_hmac` signature scheme: a hex HMAC (SHA-256 or SHA-512) over each label followed by its body
  field's value, in order, carried in a header or a query parameter and compared in constant time
  (`verifyLabelledFieldHmac`). The recipe names the fields as `labelledFields: [{ label, path }]` and may set
  `currencyDecimals: { path, currencyPath }`, which writes that amount with the minor-unit decimals of the ISO 4217
  currency at `currencyPath` from `@stackra/money`'s table (3 for KWD, BHD and OMR, 0 for JPY). A missing field, or an
  amount the currency cannot hold, does not verify. `WebhookSchemeRecipe` gains both fields.

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
- Updated dependencies [031a1f7]
- Updated dependencies [9d0dd67]
  - @stackra/database@0.26.0
  - @stackra/tenancy@0.26.0
  - @stackra/integrations@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/iam@0.26.0
  - @stackra/queue@0.26.0
  - @stackra/scheduler@0.26.0
  - @stackra/money@0.26.0
  - @stackra/model@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/events@0.26.0
  - @stackra/support@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Minor Changes

- 3942ab1: Webhook endpoints and their delivery log now belong to a tenant (ADR 0239 amendment, group (c)).
  
  Migration `webhooks.0003` gives `webhook_endpoints` and `webhook_deliveries` a `tenant_id` column. It is required,
  filled from the running tenant call by default, and indexed. Each table gets one row-level-security policy: a call sees
  and writes only its own tenant's rows. Before, neither table had a policy; the endpoint service filtered by scope.
  
  Existing rows get their tenant in the same migration. An endpoint registered at a top-level tenant node takes that
  node, and each delivery takes its endpoint's tenant. If any row is left without a tenant (an endpoint at the root, at a
  product, or below a tenant), the migration refuses before changing anything and names each table's count. Delete or
  re-register those endpoints, then migrate again.
  
  `WebhookEndpoint` and `WebhookDelivery` carry `BelongsToTenant`. Every read and write of these tables must now run in a
  tenant call; the pipeline, the delivery job and the inbox already do. The package ships an int test tier (`test:int`).
  
  `CrudService` writes that use `requiresNew` (`insert`, `insertMany`, `upsert`, `update`) now carry the caller's scope
  and tenant into their own transaction, as `Database.transaction` with `requiresNew` already did. Before, such a write
  ran on a new connection with no tenant, so row security refused it on a tenant-owned table.

### Patch Changes

- 1d7bbc1: The contract migrations (database 0007, achievements 0004, rules 0005, segments 0003, content 0006, collaboration
  0004, workflow 0011 and webhooks 0003) now carry a reviewed squawk ignore, with its reason, above each `SET NOT NULL`
  that the migration's pre-flight checked, so a product that hosts them lints clean. The runner hashes a migration
  without its lint lines, so no checksum changes, and nothing runs differently.
  
  New contract steps can set NOT NULL without scanning the table under an exclusive lock:
  `t.belongsToTenant({ contract: true, safeNotNull: true })`, or `t.change(column).notNull({ safe: true })`, adds a
  `NOT VALID` check, then validates it, sets NOT NULL and drops the check in a later step. The released migrations keep
  their form.
- Updated dependencies [1d7bbc1]
- Updated dependencies [dc9da69]
- Updated dependencies [8f8ddcf]
- Updated dependencies [3942ab1]
  - @stackra/database@0.25.0
  - @stackra/tenancy@0.25.0
  - @stackra/queue@0.25.0
  - @stackra/scheduler@0.25.0
  - @stackra/iam@0.25.0
  - @stackra/integrations@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/model@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/events@0.25.0
  - @stackra/support@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
- Updated dependencies [2df7162]
  - @stackra/actions@0.24.0
  - @stackra/database@0.24.0
  - @stackra/integrations@0.24.0
  - @stackra/queue@0.24.0
  - @stackra/scheduler@0.24.0
  - @stackra/iam@0.24.0
  - @stackra/model@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/events@0.24.0
  - @stackra/support@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [d002763]
- Updated dependencies [c0237a4]
- Updated dependencies [6edeee4]
- Updated dependencies [1d76993]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
  - @stackra/database@0.23.0
  - @stackra/integrations@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/queue@0.23.0
  - @stackra/scheduler@0.23.0
  - @stackra/iam@0.23.0
  - @stackra/model@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/events@0.23.0
  - @stackra/support@0.23.0
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
  - @stackra/integrations@0.22.0
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/events@0.22.0
  - @stackra/queue@0.22.0
  - @stackra/scheduler@0.22.0
  - @stackra/iam@0.22.0
  - @stackra/model@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/support@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/model@0.21.0
  - @stackra/database@0.21.0
  - @stackra/scheduler@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/integrations@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/events@0.21.0
  - @stackra/queue@0.21.0
  - @stackra/iam@0.21.0
  - @stackra/support@0.21.0

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
  - @stackra/integrations@0.20.0
  - @stackra/queue@0.20.0
  - @stackra/scheduler@0.20.0
  - @stackra/iam@0.20.0
  - @stackra/model@0.20.0
  - @stackra/config@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/events@0.20.0
  - @stackra/contracts@0.20.0
  - @stackra/support@0.20.0

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
  - @stackra/queue@0.19.0
  - @stackra/iam@0.19.0
  - @stackra/database@0.19.0
  - @stackra/config@0.19.0
  - @stackra/integrations@0.19.0
  - @stackra/model@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/events@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/scheduler@0.19.0
  - @stackra/support@0.19.0

## 0.18.1

### Patch Changes

- @stackra/scheduler@0.18.1
  - @stackra/iam@0.18.1
  - @stackra/integrations@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/database@0.18.1
  - @stackra/model@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/events@0.18.1
  - @stackra/support@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/queue@0.18.1

## 0.18.0

### Patch Changes

- @stackra/scheduler@0.18.0
  - @stackra/iam@0.18.0
  - @stackra/integrations@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/database@0.18.0
  - @stackra/model@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/events@0.18.0
  - @stackra/support@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/queue@0.18.0

## 0.17.2

### Patch Changes

- @stackra/scheduler@0.17.2
  - @stackra/iam@0.17.2
  - @stackra/integrations@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/database@0.17.2
  - @stackra/model@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/events@0.17.2
  - @stackra/support@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/queue@0.17.2

## 0.17.1

### Patch Changes

- @stackra/integrations@0.17.1
  - @stackra/iam@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/database@0.17.1
  - @stackra/model@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/events@0.17.1
  - @stackra/support@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/queue@0.17.1
  - @stackra/scheduler@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/integrations@0.17.0
  - @stackra/database@0.17.0
  - @stackra/model@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/events@0.17.0
  - @stackra/support@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/queue@0.17.0
  - @stackra/scheduler@0.17.0
  - @stackra/iam@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/scheduler@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/integrations@0.16.0
  - @stackra/database@0.16.0
  - @stackra/model@0.16.0
  - @stackra/config@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/events@0.16.0
  - @stackra/queue@0.16.0
  - @stackra/iam@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0
  - @stackra/support@0.16.0

## 0.15.0

### Patch Changes

- @stackra/integrations@0.15.0
  - @stackra/iam@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/database@0.15.0
  - @stackra/model@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/events@0.15.0
  - @stackra/support@0.15.0
  - @stackra/validation@0.15.0
  - @stackra/queue@0.15.0
  - @stackra/scheduler@0.15.0

## 0.14.4

### Patch Changes

- @stackra/integrations@0.14.4
  - @stackra/iam@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/database@0.14.4
  - @stackra/model@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/events@0.14.4
  - @stackra/support@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/queue@0.14.4
  - @stackra/scheduler@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/integrations@0.14.3
  - @stackra/database@0.14.3
  - @stackra/model@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/events@0.14.3
  - @stackra/support@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/queue@0.14.3
  - @stackra/scheduler@0.14.3
  - @stackra/iam@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/integrations@0.14.2
  - @stackra/database@0.14.2
  - @stackra/model@0.14.2
  - @stackra/config@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/events@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/queue@0.14.2
  - @stackra/scheduler@0.14.2
  - @stackra/iam@0.14.2
  - @stackra/contracts@0.14.2
  - @stackra/support@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/integrations@0.14.1
  - @stackra/database@0.14.1
  - @stackra/model@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/events@0.14.1
  - @stackra/support@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/queue@0.14.1
  - @stackra/scheduler@0.14.1
  - @stackra/iam@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/integrations@0.14.0
  - @stackra/database@0.14.0
  - @stackra/model@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/events@0.14.0
  - @stackra/support@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/queue@0.14.0
  - @stackra/scheduler@0.14.0
  - @stackra/iam@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/integrations@0.13.0
  - @stackra/database@0.13.0
  - @stackra/model@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/events@0.13.0
  - @stackra/support@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/queue@0.13.0
  - @stackra/scheduler@0.13.0
  - @stackra/iam@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/integrations@0.12.0
  - @stackra/database@0.12.0
  - @stackra/model@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/events@0.12.0
  - @stackra/support@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/queue@0.12.0
  - @stackra/scheduler@0.12.0
  - @stackra/iam@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/integrations@0.11.1
  - @stackra/database@0.11.1
  - @stackra/model@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/events@0.11.1
  - @stackra/support@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/queue@0.11.1
  - @stackra/scheduler@0.11.1
  - @stackra/iam@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/integrations@0.11.0
  - @stackra/database@0.11.0
  - @stackra/model@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/events@0.11.0
  - @stackra/support@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/queue@0.11.0
  - @stackra/scheduler@0.11.0
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
  - @stackra/integrations@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/queue@0.10.0
  - @stackra/model@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/iam@0.10.0
  - @stackra/support@0.10.0

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
  - @stackra/integrations@0.9.0
  - @stackra/config@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/events@0.9.0
  - @stackra/iam@0.9.0
  - @stackra/support@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/scheduler@0.8.0
  - @stackra/queue@0.8.0
  - @stackra/iam@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/integrations@0.8.0
  - @stackra/model@0.8.0
  - @stackra/config@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/events@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0
  - @stackra/support@0.8.0

## 0.7.1

### Patch Changes

- @stackra/scheduler@0.7.1
  - @stackra/iam@0.7.1
  - @stackra/integrations@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/database@0.7.1
  - @stackra/model@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/events@0.7.1
  - @stackra/support@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/queue@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [1f5bf76]
  - @stackra/iam@0.7.0
  - @stackra/integrations@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/database@0.7.0
  - @stackra/model@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/events@0.7.0
  - @stackra/support@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/queue@0.7.0
  - @stackra/scheduler@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/integrations@0.6.1
  - @stackra/database@0.6.1
  - @stackra/model@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/events@0.6.1
  - @stackra/support@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/queue@0.6.1
  - @stackra/scheduler@0.6.1
  - @stackra/iam@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
- Updated dependencies [e250d4f]
  - @stackra/database@0.6.0
  - @stackra/iam@0.6.0
  - @stackra/queue@0.6.0
  - @stackra/scheduler@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/integrations@0.6.0
  - @stackra/model@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/events@0.6.0
  - @stackra/support@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/queue@0.5.1
  - @stackra/scheduler@0.5.1
  - @stackra/iam@0.5.1
  - @stackra/integrations@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/model@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/events@0.5.1
  - @stackra/support@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/integrations@0.5.0
  - @stackra/iam@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/database@0.5.0
  - @stackra/model@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/events@0.5.0
  - @stackra/support@0.5.0
  - @stackra/validation@0.5.0
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
- Updated dependencies [b970c98]
- Updated dependencies [2bbc0e8]
- Updated dependencies [58c7da9]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/queue@0.4.0
  - @stackra/container@0.4.0
  - @stackra/events@0.4.0
  - @stackra/iam@0.4.0
  - @stackra/integrations@0.4.0
  - @stackra/model@0.4.0
  - @stackra/support@0.4.0
  - @stackra/scheduler@0.4.0
  - @stackra/config@0.4.0
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
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
- Updated dependencies [869d976]
- Updated dependencies [a60f4e9]
- Updated dependencies [f05c8e5]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/events@0.3.0
  - @stackra/iam@0.3.0
  - @stackra/integrations@0.3.0
  - @stackra/model@0.3.0
  - @stackra/queue@0.3.0
  - @stackra/scheduler@0.3.0
  - @stackra/support@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/iam@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/integrations@0.2.0
  - @stackra/queue@0.2.0
  - @stackra/scheduler@0.2.0
  - @stackra/model@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/support@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 0a8f35f: Add `CHATWOOT_WEBHOOK_SIGNATURE`, Chatwoot's inbound webhook signature as an `hmac` recipe (ADR 0448, STA-805).
- 9ca73e7: Verify provider webhook signatures from Integration data (STA-672, spec task T014). `SignatureScheme.Hmac` reads the
  Integration's `webhooks.signature` recipe (header layout, HMAC hash, hex or Base64, the signed text, the tolerance) and
  `verifyHmacWebhook` checks it in constant time; `WebhookReceiver` dispatches by scheme and keys an `hmac` event by its
  id header or payload id. `registerWebhookEvents` refuses an `hmac` Integration without a recipe.
- 2787c1e: Add `@stackra/webhooks`: Standard Webhooks signing and verification with `SignatureScheme`, the `WebhookReceiver` that
  verifies an inbound provider webhook against the secret its Integration names and routes it to its `WebhookEvent`
  class through the outbox, outbound delivery of `webhook: true` integration events as a queue job with retries, a
  delivery log, secret rotation and automatic disable, and the `deliverWebhook` test helper.
- 09823c1: Six `SignatureScheme` codes and verifiers for the regional gateways' webhook schemes that are not an HMAC over the raw
  body (STA-1357, certification pending per owner decision D3): `body_token` (`verifyBodyToken`, Moyasar), `aes_gcm_body`
  (`decryptAesGcmBody`, HyperPay), `ordered_field_hmac` (`verifyOrderedFieldHmac`, Paymob), `keyed_field_digest`
  (`verifyKeyedFieldDigest`, Fawry), `shared_header` (`verifySharedHeader`, Tabby) and `jwt_hs256` (`verifyJwtHs256`,
  Tamara), each reading the Integration's `webhooks.recipe`, all constant-time. `InboundWebhook` takes optional `query`
  parameters; `WebhookReceiver` verifies through `authenticBody` (parsing an AES-GCM body's plaintext) and keys these
  events by the payload's `eventId` path; `registerWebhookEvents` refuses a scheme whose `recipe` fields are missing.
- 8e45c25: Deliver to `s3://bucket/prefix` endpoints as signed objects through the `WebhookObjectSink` port
  (`S3WebhookObjectSinkDriver`, `WebhookObjectSinkFake`), and gate outbound events by entitlement through
  `WebhookEntitlementSource`: refused at registration and skipped at fan-out without the grant (ADR 0422).

### Patch Changes

- ae3d280: Add the `@stackra/config/contracts` entry and move the `SecretStore` port into it (one symbol, one entry): import it from
  `@stackra/config/contracts`; `@stackra/config` no longer exports it. Dependants import from the new entry.
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
- 150fa18: Signature `tolerance` is a `Duration`; a stored short form still reads through `Duration.parse`. (stackra-223)
- fd13f0e: Import the shared helpers from `@stackra/support` and delete the local copies (stackra-224): notifications
  (`base64url`, `htmlToText`), webhooks and licensing (`decodeBase64`; licensing also `isRecord`), rules (`isRecord`),
  data-transfer and identity (`crc32`), documents and experience (`escapeHtml`; experience's `./edge` and `./server`
  re-export support's), experience (`htmlToText`: the text part now has a blank line after each block, as notifications'
  did), seo and brand-kit (`escapeXml`; brand-kit now refuses a control character), market-packs (`canonicalJson`: the
  one canonical form, so integer-like keys sort as text), gen (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`),
  panel (`snakeCase`), calendar (`ageOn`, re-exported beside `LeapBirthday`) and identity (`ageOn`). Identity's
  `ActForOptions` gains `leapBirthday` (the market pack's 29 February rule; `march_1` when absent, the earlier
  behaviour). New dependency for each except licensing: `@stackra/support`.
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
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [483eb44]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
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
- Updated dependencies [0a20a9f]
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
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [ca44233]
- Updated dependencies [fbaaba0]
- Updated dependencies [22ffbbf]
- Updated dependencies [2787c1e]
- Updated dependencies [a31d463]
- Updated dependencies [158f6cf]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
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
- Updated dependencies [fc51f13]
- Updated dependencies [c7e6988]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/integrations@0.1.0
  - @stackra/events@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/queue@0.1.0
  - @stackra/scheduler@0.1.0
  - @stackra/support@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
