# @stackra/achievements

## 0.33.1

### Patch Changes

- Updated dependencies [e885a38]
- Updated dependencies [bf2c6ea]
- Updated dependencies [e885a38]
  - @stackra/database@0.33.1
  - @stackra/contracts@0.33.1
  - @stackra/tenancy@0.33.1
  - @stackra/rules@0.33.1
  - @stackra/content@0.33.1
  - @stackra/outbox@0.33.1
  - @stackra/iam@0.33.1
  - @stackra/actions@0.33.1
  - @stackra/integrations@0.33.1
  - @stackra/documents@0.33.1
  - @stackra/model@0.33.1
  - @stackra/errors@0.33.1
  - @stackra/events@0.33.1
  - @stackra/validation@0.33.1

## 0.33.0

### Patch Changes

- 628b60d: The scope-pathed models of these packages opt into `MovesWithScope`, so their rows follow a moved scope subtree (`scope.node.moved.v1`) in every service that hosts them: award kinds, awards and their verifications, rule sets, segments and their memberships, webhook endpoints and deliveries, custom fields, their value sets and content revisions, comment threads, comments, their revisions and mentions, automations, checklists and their progress, and stored settings and their revisions. The audit log (append-only, its history kept) and the scope tree itself (moved by `moveSubtree`) stay out.
- Updated dependencies [54aa1e7]
- Updated dependencies [93d63bb]
- Updated dependencies [628b60d]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [03da426]
- Updated dependencies [246594d]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/actions@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/rules@0.33.0
  - @stackra/content@0.33.0
  - @stackra/iam@0.33.0
  - @stackra/tenancy@0.33.0
  - @stackra/model@0.33.0
  - @stackra/database@0.33.0
  - @stackra/integrations@0.33.0
  - @stackra/documents@0.33.0
  - @stackra/outbox@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/events@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- @stackra/actions@0.32.0
  - @stackra/integrations@0.32.0
  - @stackra/database@0.32.0
  - @stackra/documents@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/outbox@0.32.0
  - @stackra/tenancy@0.32.0
  - @stackra/iam@0.32.0
  - @stackra/rules@0.32.0
  - @stackra/content@0.32.0
  - @stackra/model@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/rules@0.31.0
  - @stackra/integrations@0.31.0
  - @stackra/content@0.31.0
  - @stackra/documents@0.31.0
  - @stackra/outbox@0.31.0
  - @stackra/iam@0.31.0
  - @stackra/tenancy@0.31.0
  - @stackra/model@0.31.0
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
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [d8d78f0]
- Updated dependencies [7b5a381]
- Updated dependencies [88fb0eb]
- Updated dependencies [0394e56]
- Updated dependencies [a426842]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [98a8940]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [d5a7d0a]
- Updated dependencies [15dba8d]
  - @stackra/actions@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/iam@0.30.0
  - @stackra/database@0.30.0
  - @stackra/documents@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/outbox@0.30.0
  - @stackra/tenancy@0.30.0
  - @stackra/rules@0.30.0
  - @stackra/integrations@0.30.0
  - @stackra/content@0.30.0
  - @stackra/model@0.30.0
  - @stackra/events@0.30.0
  - @stackra/validation@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [09b2c41]
- Updated dependencies [4cc17e5]
- Updated dependencies [11a19a7]
- Updated dependencies [45afd22]
- Updated dependencies [1b88340]
  - @stackra/actions@0.29.0
  - @stackra/database@0.29.0
  - @stackra/integrations@0.29.0
  - @stackra/tenancy@0.29.0
  - @stackra/rules@0.29.0
  - @stackra/content@0.29.0
  - @stackra/documents@0.29.0
  - @stackra/outbox@0.29.0
  - @stackra/iam@0.29.0
  - @stackra/model@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/events@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/rules@0.28.0
  - @stackra/integrations@0.28.0
  - @stackra/content@0.28.0
  - @stackra/database@0.28.0
  - @stackra/documents@0.28.0
  - @stackra/outbox@0.28.0
  - @stackra/iam@0.28.0
  - @stackra/tenancy@0.28.0
  - @stackra/model@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/events@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [4a4d817]
- Updated dependencies [df74e1d]
- Updated dependencies [8a70552]
- Updated dependencies [7d284f2]
  - @stackra/database@0.27.0
  - @stackra/integrations@0.27.0
  - @stackra/outbox@0.27.0
  - @stackra/rules@0.27.0
  - @stackra/content@0.27.0
  - @stackra/iam@0.27.0
  - @stackra/tenancy@0.27.0
  - @stackra/documents@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/model@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/events@0.27.0
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
- Updated dependencies [031a1f7]
- Updated dependencies [9d0dd67]
  - @stackra/database@0.26.0
  - @stackra/tenancy@0.26.0
  - @stackra/integrations@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/iam@0.26.0
  - @stackra/rules@0.26.0
  - @stackra/content@0.26.0
  - @stackra/outbox@0.26.0
  - @stackra/documents@0.26.0
  - @stackra/model@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/events@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

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
  - @stackra/rules@0.25.0
  - @stackra/content@0.25.0
  - @stackra/outbox@0.25.0
  - @stackra/iam@0.25.0
  - @stackra/integrations@0.25.0
  - @stackra/documents@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/model@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
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
  - @stackra/rules@0.24.0
  - @stackra/integrations@0.24.0
  - @stackra/content@0.24.0
  - @stackra/documents@0.24.0
  - @stackra/outbox@0.24.0
  - @stackra/iam@0.24.0
  - @stackra/tenancy@0.24.0
  - @stackra/model@0.24.0
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
- Updated dependencies [d002763]
- Updated dependencies [c0237a4]
- Updated dependencies [1083617]
- Updated dependencies [6edeee4]
- Updated dependencies [1d76993]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
- Updated dependencies [12f4836]
  - @stackra/database@0.23.0
  - @stackra/integrations@0.23.0
  - @stackra/tenancy@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/rules@0.23.0
  - @stackra/content@0.23.0
  - @stackra/outbox@0.23.0
  - @stackra/iam@0.23.0
  - @stackra/documents@0.23.0
  - @stackra/model@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/events@0.23.0
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
- Updated dependencies [3a9a6be]
- Updated dependencies [ae24e3c]
- Updated dependencies [acbee14]
- Updated dependencies [227dd7a]
- Updated dependencies [940e198]
  - @stackra/integrations@0.22.0
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/tenancy@0.22.0
  - @stackra/documents@0.22.0
  - @stackra/events@0.22.0
  - @stackra/rules@0.22.0
  - @stackra/content@0.22.0
  - @stackra/outbox@0.22.0
  - @stackra/iam@0.22.0
  - @stackra/model@0.22.0
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
  - @stackra/integrations@0.21.0
  - @stackra/content@0.21.0
  - @stackra/documents@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/events@0.21.0
  - @stackra/outbox@0.21.0
  - @stackra/iam@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [80d121b]
- Updated dependencies [19a9222]
- Updated dependencies [667a3b5]
  - @stackra/actions@0.20.0
  - @stackra/database@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/rules@0.20.0
  - @stackra/integrations@0.20.0
  - @stackra/content@0.20.0
  - @stackra/documents@0.20.0
  - @stackra/outbox@0.20.0
  - @stackra/iam@0.20.0
  - @stackra/tenancy@0.20.0
  - @stackra/model@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/events@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- c3d6edc: `AwardService.verify` and `verifyCode` read the award through `CallIsolation` as a system actor in the award's scope,
  so the read runs in that scope and the tenant it resolves to, not in a scope session with no tenant (which the
  tenant equality policy of the contract step would show no rows). The service now takes `CallIsolation` where it took
  `Database` (tenancy audit 2026-11-07, gap D).
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
  - @stackra/iam@0.19.0
  - @stackra/tenancy@0.19.0
  - @stackra/database@0.19.0
  - @stackra/integrations@0.19.0
  - @stackra/rules@0.19.0
  - @stackra/content@0.19.0
  - @stackra/documents@0.19.0
  - @stackra/model@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/events@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/outbox@0.19.0

## 0.18.1

### Patch Changes

- @stackra/rules@0.18.1
  - @stackra/iam@0.18.1
  - @stackra/integrations@0.18.1
  - @stackra/documents@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/content@0.18.1
  - @stackra/database@0.18.1
  - @stackra/model@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/events@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/outbox@0.18.1

## 0.18.0

### Patch Changes

- @stackra/rules@0.18.0
  - @stackra/iam@0.18.0
  - @stackra/integrations@0.18.0
  - @stackra/documents@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/content@0.18.0
  - @stackra/database@0.18.0
  - @stackra/model@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/events@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/outbox@0.18.0

## 0.17.2

### Patch Changes

- @stackra/rules@0.17.2
  - @stackra/iam@0.17.2
  - @stackra/integrations@0.17.2
  - @stackra/documents@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/content@0.17.2
  - @stackra/database@0.17.2
  - @stackra/model@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/events@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/outbox@0.17.2

## 0.17.1

### Patch Changes

- @stackra/rules@0.17.1
  - @stackra/integrations@0.17.1
  - @stackra/iam@0.17.1
  - @stackra/documents@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/content@0.17.1
  - @stackra/database@0.17.1
  - @stackra/model@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/events@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/outbox@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/rules@0.17.0
  - @stackra/integrations@0.17.0
  - @stackra/content@0.17.0
  - @stackra/database@0.17.0
  - @stackra/documents@0.17.0
  - @stackra/model@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/events@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/outbox@0.17.0
  - @stackra/iam@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/rules@0.16.0
  - @stackra/integrations@0.16.0
  - @stackra/content@0.16.0
  - @stackra/database@0.16.0
  - @stackra/documents@0.16.0
  - @stackra/model@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/events@0.16.0
  - @stackra/outbox@0.16.0
  - @stackra/iam@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [3c99709]
- Updated dependencies [0b0cf51]
  - @stackra/documents@0.15.0
  - @stackra/outbox@0.15.0
  - @stackra/rules@0.15.0
  - @stackra/integrations@0.15.0
  - @stackra/iam@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/content@0.15.0
  - @stackra/database@0.15.0
  - @stackra/model@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/events@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/rules@0.14.4
  - @stackra/integrations@0.14.4
  - @stackra/iam@0.14.4
  - @stackra/documents@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/content@0.14.4
  - @stackra/database@0.14.4
  - @stackra/model@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/events@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/outbox@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/rules@0.14.3
  - @stackra/integrations@0.14.3
  - @stackra/content@0.14.3
  - @stackra/database@0.14.3
  - @stackra/documents@0.14.3
  - @stackra/model@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/events@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/outbox@0.14.3
  - @stackra/iam@0.14.3

## 0.14.2

### Patch Changes

- @stackra/actions@0.14.2
  - @stackra/rules@0.14.2
  - @stackra/integrations@0.14.2
  - @stackra/content@0.14.2
  - @stackra/database@0.14.2
  - @stackra/documents@0.14.2
  - @stackra/model@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/events@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/outbox@0.14.2
  - @stackra/iam@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/rules@0.14.1
  - @stackra/integrations@0.14.1
  - @stackra/content@0.14.1
  - @stackra/database@0.14.1
  - @stackra/documents@0.14.1
  - @stackra/model@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/events@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/outbox@0.14.1
  - @stackra/iam@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/rules@0.14.0
  - @stackra/integrations@0.14.0
  - @stackra/content@0.14.0
  - @stackra/database@0.14.0
  - @stackra/documents@0.14.0
  - @stackra/model@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/events@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/outbox@0.14.0
  - @stackra/iam@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/rules@0.13.0
  - @stackra/integrations@0.13.0
  - @stackra/content@0.13.0
  - @stackra/database@0.13.0
  - @stackra/documents@0.13.0
  - @stackra/model@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/events@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/outbox@0.13.0
  - @stackra/iam@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/rules@0.12.0
  - @stackra/integrations@0.12.0
  - @stackra/content@0.12.0
  - @stackra/database@0.12.0
  - @stackra/documents@0.12.0
  - @stackra/model@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/events@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/outbox@0.12.0
  - @stackra/iam@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/rules@0.11.1
  - @stackra/integrations@0.11.1
  - @stackra/content@0.11.1
  - @stackra/database@0.11.1
  - @stackra/documents@0.11.1
  - @stackra/model@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/events@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/outbox@0.11.1
  - @stackra/iam@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/rules@0.11.0
  - @stackra/integrations@0.11.0
  - @stackra/content@0.11.0
  - @stackra/database@0.11.0
  - @stackra/documents@0.11.0
  - @stackra/model@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/events@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/outbox@0.11.0
  - @stackra/iam@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/integrations@0.10.0
  - @stackra/documents@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/outbox@0.10.0
  - @stackra/rules@0.10.0
  - @stackra/content@0.10.0
  - @stackra/model@0.10.0
  - @stackra/events@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/iam@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [b174a17]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/model@0.9.0
  - @stackra/database@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/rules@0.9.0
  - @stackra/integrations@0.9.0
  - @stackra/content@0.9.0
  - @stackra/documents@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/events@0.9.0
  - @stackra/outbox@0.9.0
  - @stackra/iam@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
  - @stackra/database@0.8.0
  - @stackra/rules@0.8.0
  - @stackra/content@0.8.0
  - @stackra/outbox@0.8.0
  - @stackra/iam@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/integrations@0.8.0
  - @stackra/documents@0.8.0
  - @stackra/model@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/events@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/rules@0.7.1
  - @stackra/iam@0.7.1
  - @stackra/integrations@0.7.1
  - @stackra/documents@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/content@0.7.1
  - @stackra/database@0.7.1
  - @stackra/model@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/events@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/outbox@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [1f5bf76]
  - @stackra/iam@0.7.0
  - @stackra/integrations@0.7.0
  - @stackra/rules@0.7.0
  - @stackra/documents@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/content@0.7.0
  - @stackra/database@0.7.0
  - @stackra/model@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/events@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/outbox@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/rules@0.6.1
  - @stackra/integrations@0.6.1
  - @stackra/content@0.6.1
  - @stackra/database@0.6.1
  - @stackra/documents@0.6.1
  - @stackra/model@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/events@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/outbox@0.6.1
  - @stackra/iam@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
- Updated dependencies [e250d4f]
  - @stackra/database@0.6.0
  - @stackra/iam@0.6.0
  - @stackra/rules@0.6.0
  - @stackra/content@0.6.0
  - @stackra/outbox@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/integrations@0.6.0
  - @stackra/documents@0.6.0
  - @stackra/model@0.6.0
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
  - @stackra/outbox@0.5.1
  - @stackra/iam@0.5.1
  - @stackra/integrations@0.5.1
  - @stackra/documents@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/model@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/events@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- @stackra/rules@0.5.0
  - @stackra/integrations@0.5.0
  - @stackra/iam@0.5.0
  - @stackra/documents@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/content@0.5.0
  - @stackra/database@0.5.0
  - @stackra/model@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/events@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/outbox@0.5.0

## 0.4.0

### Patch Changes

- 3ce01cf: A package's entity list is a committed generated contract, `src/node/entities.gen.ts`, written by `stackra gen` and kept
  fresh by `stackra gen --check` (ADR 0294 R10 and ADR 0295, amended 2026-11-01, STA-1874). Each package's `./node` now
  ships its `<KEY>_ENTITIES` inlined in the build instead of importing the gitignored `.stackra/gen/entities/` at runtime,
  which failed: the 0.3.0 builds of these packages carry that broken import until this release. `stackra validate`
  expects the re-export from `#node/entities.gen`, and the doc standard skips `*.gen.ts` files.
- bc2c53e: `@stackra/access-log` and `@stackra/achievements` export `./assets/*`, so a host's generated i18n can import their
  `assets/lang` catalogues (TS2307 before). `stackra validate --repository` refuses a package with `assets/lang/` that
  does not export `./assets/*` or leaves `assets` out of `files` (STA-1798).
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
- Updated dependencies [e219411]
- Updated dependencies [79dc807]
- Updated dependencies [bb08f25]
- Updated dependencies [1856ee0]
- Updated dependencies [70e6c17]
- Updated dependencies [5f63e58]
- Updated dependencies [5fc0db7]
- Updated dependencies [36dbd49]
- Updated dependencies [8d29426]
- Updated dependencies [2bbc0e8]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/rules@0.4.0
  - @stackra/content@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/events@0.4.0
  - @stackra/iam@0.4.0
  - @stackra/integrations@0.4.0
  - @stackra/outbox@0.4.0
  - @stackra/documents@0.4.0
  - @stackra/model@0.4.0
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
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/content@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/documents@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/events@0.3.0
  - @stackra/iam@0.3.0
  - @stackra/integrations@0.3.0
  - @stackra/model@0.3.0
  - @stackra/outbox@0.3.0
  - @stackra/rules@0.3.0
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
  - @stackra/rules@0.2.0
  - @stackra/integrations@0.2.0
  - @stackra/content@0.2.0
  - @stackra/documents@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/model@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- fa0ed99: `AwardPass` (`Pass({ key: "award" })`) and `AwardPassSource` in `./node`: the award wallet pass content from the
  certificate fields (kind name, level, period, grant date, short code, verify URL as QR code), with `passes.award.*`
  labels in seven locales under `assets/lang` (now in the published files). New dependency: `@stackra/integrations`.
- 6f3ab26: Add `@stackra/achievements`: award kinds kept as scope data, awards granted by hand or automatically when a kind's
  `@stackra/rules` criteria match a recipient's facts, revoke, an opaque verify token resolved across scopes with an SVG
  QR code, certificate fields for `@stackra/documents`, and `AwardGranted` and `AwardRevoked` integration events.
- b0eb154: Add the public `VerifyAwardQuery` (`award.verify`, by token or short code), a 12-character typed code per award with
  `normalizeAwardCode` and `AwardService.verifyCode`, a unique index of live awards per kind, recipient and period
  (a lost race is `period_taken`), and `AwardService.renderCertificate` through `@stackra/documents` (STA-717, ADR 0432).

### Patch Changes

- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
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
- Updated dependencies [072a443]
- Updated dependencies [0abe92d]
- Updated dependencies [bc4acfc]
- Updated dependencies [ae3d280]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
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
- Updated dependencies [6da76a2]
- Updated dependencies [a45aec8]
- Updated dependencies [281ec71]
- Updated dependencies [830898b]
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
- Updated dependencies [9fc14fd]
- Updated dependencies [09080ac]
- Updated dependencies [0a20a9f]
- Updated dependencies [2787c1e]
- Updated dependencies [3d34a5d]
- Updated dependencies [9ab18b4]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
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
- Updated dependencies [fc51f13]
- Updated dependencies [c7e6988]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/integrations@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/content@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/documents@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/validation@0.1.0
  - @stackra/rules@0.1.0

Written by Changesets on release; never edited by hand.
