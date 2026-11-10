# @stackra/gen

## 0.33.0

### Minor Changes

- 0a57fb3: Gen builds a Fumadocs site from a docs member too: a member whose package.json has `"stackra": { "kind": "docs" }`, with its pages under `content/`, its navigation in each folder's `meta.json` and its settings in `docs.yaml`, described by the new `@stackra/gen/schema/docs.json`. A docs app with `src/config/docs.config.ts` builds exactly as before.
- 2e3e323: A connector package's manifest lists its `WebhookEvent` classes in `webhookEvents` (class, entry, Integration and
  Connection), and a hosting service registers them from it, so the service names no provider. Gen refuses a hosted
  event that is half paired (`webhook_event_unpaired`) or routed twice (`webhook_route_duplicate`), and an own event
  typed against a hosted Integration now carries that Integration's Connection, so its connection URL routes.
- 54aa1e7: Gen reads a `stream: true` action's `Promise<ReadableStream<Chunk>>` output (no output shape), marks the manifest entry `stream: true`, and projects its 200 response as `text/event-stream` in `openapi.json`. A `stream` option and a stream output that disagree fail with `stream_output_mismatch`.
- 41a5ff0: A package with a `src/**/__tests__/<name>.e2e.page.tsx` now gets `.stackra/e2e/` (`index.html`, `main.tsx`, `vite.config.ts`: a small Vite app that renders the page named by the URL path) and `.stackra/playwright.e2e.config.ts`, both built on `@stackra/testing/e2e`. An app, a service or a package with no e2e page gets none of them.

### Patch Changes

- 6186329: A service's tsconfig no longer needs `baseUrl` for Encore. TypeScript 7 removed `baseUrl` (TS5102), so the rule from 0.30.0 broke typecheck in a TS 7 repository (INVOICING).
  
  - **The service check:** it now requires only `compilerOptions.paths` equal to package.json `imports`, which resolve from the tsconfig's folder. It refuses a `baseUrl`.
  - **`stackra encore:prepare`:**
    - it removes an existing `baseUrl`;
    - it writes package.json and tsconfig.json with gen's `formatJson`, now exported from `@stackra/gen`, in the repository formatter's layout, so the format check passes after it.
  
  Bump step: run `stackra encore:prepare` in each service, or delete `"baseUrl": "."` from its tsconfig.
  
  `stackra encore:prepare` also keeps a tsconfig's file contract written inside the braces (NOTIFY's services). Before, it kept only the `//` lines above the object, so the contract was dropped and the format check failed. `encore.dev` stays the literal catalog version (ADR 0091 rule 3): Encore rewrites `catalog:` to `^<version>`, which breaks the frozen install.
- 93d63bb: An action or query whose actors include `ActorKind.ApiClient` (`api_client`) now gets an endpoint, derived or written. An API-key caller such as a tenant's servers reaches the service like a user. Before, a `public` action whose only external actor was `api_client` got no route, and strict gen refused it with `public_without_endpoint`, even with an explicit `endpoint` (BILLING-B, `meters.usage_event.record_batch@1`). An action for services alone still gets none.
- 3c47a3a: A package's `src/node/entities.gen.ts` is stable under gen. Gen counted any `[OptionalProps]` under `src/` as one the
  member wrote beside its model, and so read its own last augmentation in `entities.gen.ts` as authored: it wrote none
  (`optional: []`), and the next run wrote it back. The committed file flipped on every run, and the gate's "Committed
  manifests match gen" passed or failed by which version was there before (stackra#1030 to #1032, `TenantDataKey`).
  Gen now ignores its own entities file in that check; a member's own `[OptionalProps]` still wins (STA-1750).
- 93d63bb: A consumed service's lang namespace that its own contract package also ships (`<service package>-contract`, declared) is taken once, from the contract. It no longer fails gen with `i18n_namespace_clash`.
  
  PAY hit this as soon as payments declared `@stackra/i18n`. The namespaces were consent (compliance-privacy), delivery and inbox (notify), and domains, entities and memberships (tenancy): each was read from both the declared contract and the consumed service's own `assets/lang`.
  
  A namespace shipped by two unrelated packages still clashes.
- 4bf092e: A webhook event typed by an integration `import type`d from a hosted package's entry is now registered with that integration. For example: `WebhookEvent<QuiqupIntegration>`, with `QuiqupIntegration` from `@figentra/ship-connector-quiqup/node`.
  
  Before this, the reader could not resolve the package's types and named the partner `unknown`. `registrations.ts` then imported `unknown` and registered `integration: undefined`, so no route or signature check was tied to the event. Nothing typechecks `.stackra/gen`, so it broke only at runtime: Ship's carriers and Pay's Stripe.
  
  - The reader now takes the name from the import itself, using the exported name for an aliased import.
  - gen refuses a partner it still cannot name, with `partner_unresolved`.
  - The registrations emitter never imports `unknown`.
- 93d63bb: `endpoint_area_mismatch` now accepts a public call under RFC 8615's `/.well-known/`. A well-known path is a convention across hosts, not an area route. Checkout's `GET /.well-known/stackra/frame-ancestors`, the edge's frame-ancestors callback, was refused before.
  
  Only the public area gets this. A call in any other area under `/.well-known/` is still refused, and the method, collision and version checks apply as before.
- 93d63bb: Tests on `useDrivers("memory")` no longer need per-test overrides for two fail-closed ports and for seeders' services (os#256).
  
  - **`@stackra/actions/testing`:** the testing plugin now offers a memory `RateLimitStore` (`MemoryRateLimitStoreDriver`) and a memory `JobDispatcher`. The new `MemoryJobDispatcherDriver` keeps every queued job in `jobs` and runs none.
    - Production still fails closed: these bind only in a testing module, and only when the test picks "memory".
    - `ApprovalGate` is left out on purpose. An action that declares `approval` fails closed without a real gate and its binding store (ADR 0509), so a test that runs one binds `MemoryApprovalGateDriver.of(...)` and `MemoryApprovalBindingStoreDriver` itself.
  - **gen:** a service that only a seeder injects is now wired. Example: a minimal seeder's `SettingsPackService`. Before, `.seed(XMinimalSeeder)` failed with "Nothing binds SettingsPackService".
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/contracts@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/money@0.33.0
  - @stackra/support@0.33.0

## 0.32.0

### Patch Changes

- 597e3e8: A generated docs site titles its home page (`index.mdx`, or a language's `index.<lang>.mdx`) by the page's own
  words alone, not followed by the site name it already names ("Figentra Geo · Figentra Geo"). The build now also fails
  when a prerendered title repeats a part.
- @stackra/errors@0.32.0
  - @stackra/money@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/support@0.32.0

## 0.31.0

### Patch Changes

- 73ea174: A model whose last word is already plural keeps it in its derived table name and resource path. `OpeningHours` is now `opening_hours`, no longer `opening_hourses`. The same goes for `news`, `series`, `settings`, `analytics`, `species`, `preferences` and the rest of `INVARIANT_PLURALS`. Regular nouns that end in `s` (`address`, `class`, `bus`) still take `es`.
- 137a7f9: Every automation run a trigger or a schedule starts is now checked against the new `AutomationQuota` port, which `AutomationService` injects, so a host that runs automations must select a driver. Over the quota, the run is skipped and `AutomationRunSkipped` (`quota_exceeded`) is recorded; that is not a failure. A quota that cannot be read starts nothing and records `quota_unavailable` (fail closed); `triggered` never throws for a quota. `AutomationService.triggered(block, startedBy)` takes an `AutomationStart`, kept on the skip. Gen's platform binding of `AutomationService` gains the port.
  
  Release order: this core release first; then Figentra Billing publishes its usage client package with the driver (`credits.quota.check@1` on `automation.runs`, called as the host member inside the automation's tenant); then os bumps and selects that driver in the same pull request. No host takes `UnlimitedAutomationQuotaDriver` as a stopgap: it is only for a host that sells no automation quota.
- @stackra/money@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/support@0.31.0

## 0.30.0

### Minor Changes

- 96b5241: **Route change for anonymous-only calls.** An action or query whose actors are exactly `[ActorKind.Anonymous]` (served
  with `auth: false`) now defaults to the `public` API area, in gen and at runtime, so its route is `/public/...` and it
  sits where no gate asks for a principal. A written `area` still wins, and a call with any other actor keeps the
  service's area or `app`. Gen's identity lock accepts the move under the call's own area, as for STA-340. What a product
  does on its bump: run `stackra gen` and commit the regenerated `stackra.manifest.json` and `openapi.json`.
- 04d04e4: API keys reach the action pipeline: `CallAuthenticator` verifies a bearer that is an API key with identity's
  `ApiKeyVerifierService` and answers its principal as an `api_client` actor with the key's call options
  (`KeyCallOptions`: credential, origin, sandbox for a test key); a forwarded user token beside a key is refused.
  `serveGuardedCall` reads `Origin` for it and hands the options to `execute`, and gen's adapters pass them to
  `ActionPipeline#execute`. Run `stackra gen` after upgrading.
- 0bf0a7f: Collaboration rooms are hosted with no hand wiring. A model declares `@Collaborative({ view, edit })`, and a service
  that declares `@stackra/collaboration` serves `collaboration.room.token@1` (the checked one-time room token: the record
  in the caller's tenant, its view permission, `LiveCollaborationEntitlement` for the scope, `mayEdit` from its edit
  permission), `collaboration.room.publish@1` and `RoomController`, the room's event stream at `REALTIME_ROOM_PATH`,
  through the package's new root `CollaborationModule`. `RoomMemberRole` (`collaboration.room_member`) grants the two L2 room
  permissions. A client binds `RoomTokens` to `ClientRoomTokensDriver` over its
  `DynamicClient`.
  
  `RoomGrant.recheckEdit` (realtime): the room asks the edit right again before relaying each `update`, so a permission
  revoked mid-session drops the member's next edit; `RoomMember.publish` returns a promise for such an update.
  
  Gen: a package manifest lists its raw controllers in `services` with their `path`; a host binds a hosted package's
  controllers, and its Encore `api.ts` serves a hosted package's actions, queries and controllers (the package needs an
  authored root module); `endpoint_collision` also counts raw controllers (own and hosted, any method, a trailing `/*`
  covering what is under it); the generated HTTP adapter streams answer bodies instead of buffering them.
- 5b064da: A service's Encore app root is the member root: gen writes `encore.app` at `services/<name>/encore.app` (gitignored) and no longer writes `.stackra/encore/encore.app` or `.stackra/encore/package.json`, so Encore resolves the member's `node_modules` and, with the tsconfig `paths` block, its `#` imports. The generated services stay in `.stackra/encore/<svc>/`. `encore_app_stray` now refuses only an `encore.app` at the repository root. Breaking: `emitEncorePackage` is removed.
- e1e1b5e: Gen refuses an Integration whose `webhooks` use a scheme other than Standard Webhooks (`hmac` or a regional gateway's)
  and name neither `eventId` nor `signature.idHeader`, with `webhook_event_id_undeclared`. Such an Integration keyed every
  inbound event by the id `""`, so the inbox kept only the first one. Name `eventId` (the payload `path` of the
  provider's event id, or `parts` of paths and headers) or a signature `idHeader`, or use `SignatureScheme.StandardWebhooks`.
- cd2496b: An anonymous caller keeps one visitor id across requests. `serveGuardedCall` resolves the visitor from a signed token
  (the `stackra-visitor` header, else the httpOnly `stackra_visitor` cookie) through `VisitorIdentityService`, and an
  answer to a new visitor, or one signed with the previous key, carries the token back. The token is an HMAC-SHA-256
  over the `anon_` id with the `STACKRA_VISITOR_SIGNING_KEY` secret (`STACKRA_VISITOR_SIGNING_KEY_PREVIOUS` is accepted
  for rotation). Until the secret is set, every anonymous call is a new visitor, as before. Gen's adapter fills the
  new `visitor` seam.
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
- 15dba8d: The tenancy contract step's two checks are now errors (ADR 0239):
  
  - `assertRowSecurity`: a table without the owner column that no platform list names is a gap, by default. It no longer
    reads `STACKRA_GEN_STRICT`; only the audit's own tests pass `strict: false` to read such tables back as warnings with
    their group. A service's generated isolation test therefore fails on one.
  - gen's `model_tenancy_missing` (and `model_tenancy_migration_missing`) are errors for a package's models, as they
    already were for a service running `@stackra/tenancy`.
  
  Before taking this version, a product must have zero such tables and models: list a table that holds no tenant data
  with `t.platformTable(reason)` (or `t.reviewedPolicy(reason, policies)`), give a tenant table its owner column, and
  mark each model `BelongsToTenant`, `BelongsToTenantOrPlatform` or `Model.global`. Core itself has none.

### Patch Changes

- 7d60f82: `EdgeHeaderGuard` is bound in every generated service and checks edge traffic only. A request that carries any edge
  header must verify (fail closed); a request with none is not edge traffic and goes on to authentication or its
  endpoint's own signature check, so service calls, cross-app deliveries and webhooks keep working. `publicPaths` is
  removed from the guard. New `EdgeConfig` (`app.edge`) chooses the drivers: `keys` is `memory` or `env`, which reads the
  `STACKRA_EDGE_SIGNING_KEYS` secret (newest first, comma-separated); `nonces` is `memory`, so a replay is refused per
  instance until a shared nonce store ships.
- 418e195: The generated Encore adapter passes the call headers to the action pipeline (`requestCallOptions(request)`): a client's `Idempotency-Key` and `Stackra-Consent` were dropped before.
- e1e95d1: A service a member depends on (for its contract) ships its lang catalogues as that service's, so a namespace both share moves under the service's name (`I18n.payments.plans`) instead of refusing with `i18n_namespace_clash`; the member keeps the bare namespace.
- dab9009: The gen golden fixtures commit the seed entry (`.stackra/entry/seed.ts`) that gen writes for the `service` fixture's shop
  and the overlay fixtures built on it, since that shop has a seeder and a factory (STA-2061). Tests only; gen's output is
  unchanged.
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [ef49e63]
  - @stackra/contracts@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/money@0.30.0
  - @stackra/support@0.30.0

## 0.29.0

### Minor Changes

- 3361957: An action whose actors are exactly `[ActorKind.Anonymous]` may declare `credentials: "ignore"`, for a public page whose visitors may also be signed in elsewhere. The pipeline then runs a signed-in caller's call as a fresh anonymous actor and drops what the credential gave, and `serveGuardedCall` never verifies or holds that credential, so no user token is forwarded. Without the option such an action still refuses a signed-in caller. `Action({...})` throws, and gen refuses `credentials_ignore_not_anonymous`, when the actors are anything else. Limit: a host's optional `BearerTokenGuard` runs before the adapter, so it can still refuse an expired or invalid token on such an action; a host that serves these actions should let them pass that guard.
- 1b727b9: Settings fields are never dropped: gen refuses a field no setting type holds with `settings_unsupported_type`, and writes an enum or driver name as a `choice` key and a string or enum array as a `list` key (`SettingType.Choice`, `SettingType.List`, `SettingKeyInput.options`, and `readonly string[]` as a `SettingValue`). Gen derives the group key from the class name as the runtime does (`AccountSettings` is `Settings.account`), refuses `settings_scope_widened`, `settings_too_deep`, `settings_group_key_empty` and `settings_group_conflict`, and records every group and key in a `settings` section of `stackra.manifest.json`; a group or key rename needs `@Renamed`. An enum setting field is now `choice` with its `options`, not `string`, and a group whose key is not its module's carries the group in its label key. Regenerate with `stackra gen`.
- 45afd22: `Action` and `Query` take an `entitlement` option (one entitlement class or a list), and gen now gates calls by it
  (STA-2059, ADR 0215). The manifest lists a call in the `gates` of every entitlement it names, of a quota whose meter it
  feeds (`meter`, `per` on the quota entry; `meter` and `entitlements` on the action entry) and of a limit counting a
  model it creates, including an entitlement or model a hosted package ships. A name that resolves to nothing fails the
  build with `entitlement_unknown` or `entitlement_counts_unknown`.
- 25b99da: The seed entry (`.stackra/entry/seed.ts`) registers the service's factory pairs with `registerModelPartners`, so a
  demo seeder that uses a factory runs under `stackra db seed`. It also runs the seeders of the packages a service hosts,
  imported from each package's `./testing` entry, before the service's own, and lists every seeder in module-dependency
  order instead of file order (STA-2061).
  
  `stackra.manifest.json` gains two optional sections, `seeders` (key, module, profile, class, file, in module order) and
  `factories` (class, file, model), which a host reads from its dependencies. The committed manifests of
  `@stackra/loyalty-kit` and `@stackra/access-log` now carry them.

### Patch Changes

- f069f95: A consumed service's lang namespace that one of the member's own modules also has no longer clashes: it lives under
  the service's client name (`geography.rates`, keys `geography.rates::<path>`, loaded from the service's own
  `rates.json`), and the member's own namespace keeps its name. A package and the member claiming one namespace is still
  refused (`i18n_namespace_clash`).
- edc2781: The resource-table index check reads an `@Index` that leads with the scope column (`tenantId` or `scopeId`) as serving
  its next column too, since row-level security already narrows a scoped table to one scope; a filter or sort on that
  column is no longer refused as `filter_not_indexed` / `sort_not_indexed`.
- b26036e: Gen reads `@Setting({ scopes, lockable, approval })` field options again. `Setting` returns `FieldDecorator<unknown>`, which the facet reader did not recognise, so generated setting keys carried only their class scopes and no `approval` or `lockable`.
- 8ad5f87: In a memory-tier testing app, `ScopeTree` now reads the nodes `ScopeNodeService` writes. `MemoryScopeTreeDriver`
  gains `readFrom(load)`: until it is seeded, every read goes to the tree `load` resolves to. The new
  `SCOPE_TESTING_PLUGIN` (registered by `@stackra/scope/testing`) points an unseeded memory tree at the Database's
  `ScopeNode` rows through `PostgresScopeTreeDriver`, so `node`, `byPath` (with the node's `level`), `ancestors` and
  `descendants` see a node added through `ScopeNodeService`, as in production. A seeded tree (`fakeScopeTree`) keeps its
  own list. Gen's Vitest setup imports `@stackra/scope/testing` for a member on `@stackra/scope`.
- 75ec6eb: Gen loads extensions: `#stackra/registrations` calls `registerExtensions` with each extension on its point's slot and
  its order, and a service with an extension connects the slots at boot (`connectExtensions(container)`). Until now
  nothing called `registerExtensions`, so every extension point's slots ran no extension.
- @stackra/money@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/contracts@0.29.0
  - @stackra/support@0.29.0

## 0.28.0

### Patch Changes

- f0be8d8: A service that runs `@stackra/queue` now connects `QueueWorkerService` in its generated `boot`, so a job that a
  generated Encore subscription delivers, or that `queue:work` reserves, runs through the pipeline instead of throwing
  "QueueWorkerService is not connected" (STA-2046).
- 7a87018: `stackra gen` refuses (`port_unbound`) a class whose constructor takes a port that no driver binds in the member, instead of letting every container-built test fail with `UnresolvedPortError`.
- @stackra/money@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/support@0.28.0

## 0.27.0

### Patch Changes

- fb1ae38: A service that declares a workflow gets the `WorkflowRunner` driver table in its wiring (`pipelinePorts`), as
  STA-2573 did for the pipeline's other ports: the pipeline resolves the runner for `ctx.run` and `ctx.signal`, and no
  constructor injects it, so it was left unbound ("WorkflowRunner is not bound"). The generated Vitest setup also imports
  `@stackra/workflow/testing` for a member on `@stackra/workflow`, so a `useDrivers("memory")` test connects that runner.
- @stackra/money@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/support@0.27.0

## 0.26.0

### Patch Changes

- ec00fd8: A generated Encore app can now be checked and built. Gen writes `.stackra/encore/package.json` (private, ES modules)
  beside `encore.app`, since Encore reads the app root's `package.json` to start (`encore check` failed with "failed to
  read package.json"). It also copies the compiled migrations under the Encore service and declares
  `migrations: { path: "./migrations" }`, because Encore takes only a local relative migrations path in the object form.
- 081989b: A Connection that extends another Connection (`class RegionalConnection extends BaseConnection`) is now paired with
  the member's Integration of the same stem (`RegionalIntegration`), or inherits its base's integration when there is
  none. Its Integration gets its `connection` in the manifest and `registerConnections` registers the pair; before, the
  subclass had no partner and was skipped. Two same-stem Integrations in one member are `connection_partner_ambiguous`.
  An Integration's connection is the one named after it, so a subclass that only inherits never displaces it.
- b1603a7: Gen refuses every package a member's generated wiring needs through undeclared ones in one run, with the `package.json` lines to paste, instead of one layer per run.
- 5c0aafc: The generated Vitest setup imports `@stackra/actions/testing` for a member on `@stackra/actions`, so a `useDrivers("memory")` test that only queues work finds the memory `AccessControl`.
- 9b02a7c: A host binds the actions and queries of each package module it hosts, as it does that package's services: they are
  the module's surface, so a test or a client can call one by class (`run(EnrollMemberAction, …)`) without a host class
  injecting it. A published package's manifest lists its actions and queries in `services` with their constructor
  tokens, and the host wiring binds each one with them.
- @stackra/money@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/support@0.26.0

## 0.25.0

### Patch Changes

- 689c37b: A generated docs site serves its home page again. The routes had only a top-level splat, which React Router does not
  match for `/`, so the root `index.mdx` prerendered as the bare shell and every docs site showed a blank home page. An
  index route now serves it through the same page module. The generated `react-router.config.ts` also fails the build
  when a page listed in `app/site.json` prerenders without a `<title>`, so a page no route matches cannot ship blank.
- 8a8fa6f: Gen sees `ctx.run<Output>(XWorkflow, input)` as the action starting `XWorkflow`, as it does the untyped call, so an
  action may type the run's result and still pass `checkActionFirst`.
- @stackra/money@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/support@0.25.0

## 0.24.0

### Minor Changes

- 35959f6: An action or a query can name the data class it handles: `dataClass: DataClassification.Financial`, or a product's
  own `DataClass({ key })` class. Gen writes the key on the call's manifest entry (`dataClass`) and refuses a value it
  cannot read with `data_class_unknown`; the catalogue manifest schema names the field. Tamo's gateway uses it to keep a
  run in region by the most sensitive class among the tools it calls.
- b4c2501: A query may keep a permission above L1 when it says why: a `// reason: …` above or trailing its `permission`
  (or its `key`, for a derived permission) lets `query_above_l1` pass, and the manifest records it as `riskReason`.
  Without a reason the query is still refused. For deliberate floors that strict gen must not lower: an audit
  export, reads that return credentials, raw provider payloads, hashed personal data.
- 2df7162: The row-security audit learns the group (c) decisions (ADR 0239 amendment).
  
  `assertRowSecurity` now accepts a table that keeps its tenant in `scope_id`, when its one permissive policy is exactly
  the `equals` or `equalsOrUnset` policy `t.rowLevelSecurity` writes on the tenant setting. It then checks that table
  like any owned one, with the two-tenant probe on `scope_id`. A looser policy, such as one that adds `or true`, or a
  second permissive policy, is still refused. Core payments' three tables pass this way, with no migration.
  
  Migrations gain two declarations, each with a required one-line reason:
  
  - `t.platformTable(reason)`: no row of this table can ever belong to a tenant. Compiling refuses it on a table that
    also writes a scope id, an isolation scope id, a column filled from a setting, or a policy. The audit refuses it once
    the table holds the tenant column, a scope id or an isolation scope id.
  - `t.reviewedPolicy(reason, policies)`: the table's policies have a reviewed shape the audit cannot derive. The audit
    still requires row-level security enabled and forced, and every named policy present. Only the tenant-policy checks
    and the probe are left out.
  
  The compiled migration carries each declaration as a comment line. Gen's generated isolation test now passes its
  migrations folder to the audit (`migrationsDirectory`), which reads them.
  
  `PLATFORM_TABLES` gains the platform-list tables: `outbox.inbox`, `outbox.change_cursors`, `queue.job_batches`,
  `scheduler.watermarks`, `workflow.service_ack_sets`, `rules.condition_fields`, `database.seed_records` and
  `scope.scope_nodes`, each with its reason.
  
  New command `stackra row-security-declarations` lists every declaration with its reason. It and
  `stackra validate --repository` fail on a declaration that is not in the reviewed list
  `tools/scripts/row-security-declarations.yaml` with that reason.

### Patch Changes

- @stackra/money@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/support@0.24.0

## 0.23.0

### Minor Changes

- 7ff4969: Docs sites in more than one language. `DocsConfig.locales` lists the languages, with one default:
  
  - **Pages.** A page in another language sits beside its default page as `<page>.<code>.mdx` and is served under
    `/<code>/`. A page that isn't translated yet links to the default page in that language's navigation.
  - **Direction.** The page sets `lang` and `dir`, so an Arabic page renders right to left, sidebar included.
  - **Interface.** Each language gets its own interface strings, navigation labels and font. Arabic ships with its
    strings and IBM Plex Sans Arabic.
  - **Language switch.** The switch keeps the reader on the same page.
  - **Checks.** gen refuses a translation that has no default page and a page that sits in a language's folder. A page
    not yet translated is only a warning.
  - **No change by default.** With `locales` left empty (the default), a site is written byte for byte as before.
- 96374f4: An L3 or L4 action is no longer an agent tool by default. It becomes one only with `tool: true` and a `// reason:`
  line, and gen fails with `tool_reason_missing` without the reason. The manifest records the reason on the tool and,
  for a high-risk user action left off, a `toolOff` note. Owner security decision 2026-11-08.
- c26fb86: Every generated HTTP adapter is an Encore raw endpoint that runs the request guards (STA-2577, ADR 0237 note of
  2026-11-08). `@stackra/app/server` adds `serveGuardedCall` and `HttpConfig` (`app.http`, `maxBodyBytes`, 1 MiB by
  default): the body is read once under the cap (413), every `RequestGuard` runs over the exact bytes (so the edge
  signature covers the body), `CallAuthenticator` verifies an `Authorization` header (a bad one is refused, never
  anonymous), then the input is parsed and the action pipeline runs; guard and authentication failures are one generic
  401 or 403. `@stackra/gen` now writes `api.raw()` endpoints (auth: false to Encore) for actions, queries and
  controllers through `answerCall` in `http.ts`, binds `app.http` in the wiring, and no longer writes `auth.ts` or the
  `Gateway`.
  
  GET and DELETE query strings are typed by the call's registered input schema (`coerceQueryInput`): finite numbers,
  `"true"` and `"false"`, and arrays element-wise; enums and strings stay as sent, and a value that does not fit stays a
  string so validation refuses it. A void output answers 200 `null`.
  
  New reachable surface: the typed `api()` skipped every entry whose input or output was not a schema class of the
  member, so those had no HTTP route. They now get one, behind the same guards, authentication and permission checks:
  generated search and report queries, replica queries (`ReplicaPage` output) and any other action or query whose
  schemas come from a package. The gen fixtures show it only for the billing unit fixture (`BILLING_IR`), and no golden
  gains an endpoint. A hand-written `Controller` is now served too (every method, behind the guards), reachable with no
  `Authorization` header; a present but invalid or expired one is 401 and never falls back to anonymous.
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
- f790fa1: A service now gets its own token from ZITADEL by itself, and sends it on every call to another service.
  
  - `ZitadelServiceTokensDriver` (`zitadel`, in `@stackra/identity/node`) signs in as the service's own ZITADEL
    service account with the JWT profile. It reads the account's key file from the secret store, signs a short-lived
    assertion, and asks the issuer for a token for the receiving product's project. Each token is reused until shortly
    before it expires, and callers asking at the same moment share one request. The key and the tokens are never
    logged, never put in an error and never put in an event. If the issuer refuses, the error is
    `ServiceTokenRefusedError`. If it cannot be reached or is failing, the error is `ServiceTokenUnavailableError`.
  - A service that declares `@stackra/app`, `@stackra/clients` and `@stackra/identity` now uses the `service` client
    session and the `zitadel` token driver by default, so its generated clients need no extra wiring.
  - If a call goes to a producer module that has no `clients.audiences` entry, the call fails with an error naming that
    module, before any token is fetched. A call is never sent without a token.
  
  What each deployment must set (the values come from the owner or runway, the names are below):
  
  - `identity.service_tokens.issuer`: the ZITADEL issuer URL, the same as the bearer issuer.
  - The secret `IDENTITY_SERVICE_ACCOUNT_KEY`: the service account's ZITADEL key file (JSON). Set
    `identity.service_tokens.keySecret` to use another secret name.
  - `clients.audiences`: for each producer module the service calls, the project id of the product that serves it.
  - In ZITADEL, the service account's access token type must be JWT, because the receiving service checks the token
    against the issuer's public keys.

### Patch Changes

- 926faa4: A dependency imported only through its `./contracts` entry stays fully hosted when it drives a port gen binds without
  injection: the action pipeline's own (`EventOutbox` for `ctx.publish`, `IdempotencyStore`, the offline, review and
  step-up stores, `ReplicaReads`), the follow-the-system defaults and the server contributions' tokens. Before, such a
  package was hosted contracts-only and the port was left unbound ("EventOutbox is not bound").
- 557809c: A package that ships routes in its `react` or `native` entry gets its `Routes` ref table, `.stackra/gen/routes.ts`
  (`#stackra/routes`): one `routeRef` per route stem, keyed `<module>_<stem>` as its manifest's `ui.routes` records and
  its host app registers, so the package's own pages link to its routes by ref.
- 8b42c02: A published package's manifest lists its extension points in `services`, beside the services that inject them, so a
  host's wiring binds them. Commerce customers injects `AccountService` from `@stackra/loyalty-kit`, whose
  `LoyaltyKitExtensionPoint` had no binding and failed with `UnboundTokenError`.
- 1083617: Memory-tier tests now run actions in the actor's tenant, as production does, so `runAsTenant` wraps around `run()`
  become optional. Under `createTestingModule(...).useDrivers("memory")` the tenancy testing plugin binds
  `MemoryCallIsolationDriver` as `CallIsolation`: a `BelongsToTenant` row built inside the call carries the actor's
  tenant before it is flushed. An actor with no tenant stays a platform call. Inside `runAsTenant(T)`, an actor of
  another tenant is refused with `TenantSwitchRefusedError`, as the real driver refuses a tenant switch. An explicit
  `.override(CallIsolation, …)` still wins. The driver is test-only: production wiring never lists it. Gen's Vitest setup
  now loads `@stackra/tenancy/testing` for a member on `@stackra/tenancy`, as it loads the database and clients testing
  entries.
  
  **Upgrading.** A product's memory-tier tests now run each action inside its actor's tenant, so a test that relied on
  no isolation can fail after the bump:
  
  - Arrange each tenant's rows under that tenant: `await runAsTenant(tenantA, () => Factory.new().create(...))`, then
    `runAsTenant(tenantB, …)` for B's rows. A row built inside `runAsTenant(A)` by an actor of B is refused
    (`TenantSwitchRefusedError`), and a row whose `tenantId` differs from the `runAsTenant` tenant throws.
  - Call `run(Action, input, { as: actor })` outside any `runAsTenant`, or inside the actor's own tenant. A
    `runAsTenant(tenant, () => run(...))` wrap around an action of that same tenant still works but is no longer needed.
  - `drainOutbox()` delivers each event in its actor's tenant. Call it outside `runAsTenant`: inside `runAsTenant(T)`, an
    event of another tenant is refused in the memory tier (production's own transaction would not refuse it).
- a2c8821: A seeder that injects its repositories or services now runs wherever seeders run. A seeder is not a binding, so the
  container could not build one with its dependencies: `.seed()` and `stackra db seed` built it with no arguments and its
  first repository call failed. `seederOf(container, type, deps)` (`@stackra/database/node`) builds a bound seeder from the
  container, else the class with its constructor tokens resolved in the container. Gen lists those tokens in the seed
  entry (`SeederEntry.deps`) and registers them in the test setup (`registerSeederDeps`, `@stackra/database/testing`).
- fb6e2b3: A role-gated setting approval: `@Setting({ approval: { by: SystemRole.Owner } })` holds a change until someone holding
  that role approves it, beside the existing four-eyes `approval: true`. The revision records the role (`approvalRole`,
  migration `settings.0003_add_setting_revision_approval_role`); `SettingsResolver.approve(id, approver, roles)` refuses
  an approver without it (`SettingApproverRoleError`, forbidden) and fails closed when the calling action passes no roles.
  The role is the control, so its holder may approve a change they wrote; `decidedBy` records who did. One change needs
  one approving role. Gen treats a role-gated key as approval-marked too.
- @stackra/money@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/support@0.23.0

## 0.22.0

### Patch Changes

- e41d9a1: A class gen names in a wiring comes from the entry that really exports it. `BearerConfig` is imported from
  `@stackra/app/server`, both in the follow-the-system row and in a package manifest's driver, service and config
  entries, which now name the entry whose barrel exports the class (`@stackra/app`'s configs live in `src/config` but are
  exported from `./server`). Before, every service declaring `@stackra/app` failed typecheck on 0.21.0 with
  `Module '"@stackra/app"' has no exported member 'BearerConfig'`. A new test checks every class gen names by hand
  against the real package entry.
- 4663a61: A package's generated `tsconfig.build.json` is written in oxfmt's layout (short arrays on one line), so a member's
  `oxfmt --check` passes on the file exactly as gen writes it.
- @stackra/money@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/support@0.22.0

## 0.21.0

### Minor Changes

- 2974e54: Subresource Integrity for extension bundles. The bundle build records a sha384 for every emitted file in
  `bundle.manifest.json` (`integrity`). Runway refuses to publish a bundle whose file is missing or changed since the
  build, carries each value by URL on the edge release, and the shell page pins every bundle URL with it: an
  `integrity` attribute on each modulepreload and stylesheet link, and the import map's `integrity` block for the
  chunks no link names. A bundle built before this has no `integrity` and renders as before.
- ae9cb23: One generated Encore auth handler for user and service calls (ADR 0209, amendment of 2026-11-07, point 5).
  `@stackra/app/server` adds `CallAuthenticator`: it reads `Authorization: Bearer`, verifies the token with
  `verifyBearerToken` under `BearerConfig` and the bound `JsonWebKeys`, and maps it to its actor with
  `@stackra/identity`'s `actorOf`, answering `{ userID, actor }` (`CallAuthData`). Every failure is one
  `BearerTokenInvalidError`, with no detail and never the token; a `Stackra-On-Behalf-Of` header is refused until the
  forwarded user token is verified. For a service with endpoints, `@stackra/gen` now writes
  `.stackra/encore/<member>/auth.ts`: the app's one `authHandler` over those two headers, which runs `CallAuthenticator`
  and answers `APIError.unauthenticated` on its refusal, and the app's one `Gateway`.
- a785356: The geospatial field kit on PostGIS (ADR 0314, STA-1432):
  
  - `@stackra/contracts`: the `GeoPolygon` and `GeoLine` types beside `GeoPoint`.
  - `@stackra/validation`: the `geoPoint()`, `geoPolygon()` and `geoLine()` schemas.
  - `@stackra/model`: the `GeoPointType`, `GeoPolygonType` and `GeoLineType` column types (EWKT in, `ST_AsGeoJSON` out).
  - `@stackra/database`: `t.point()`, `t.polygon()` and `t.line()` with default GiST indexes, the `areaCovers`,
    `withinMetresOf` and `intersectsArea` conditions, the `HasLocation` trait, and PostGIS in the PGlite memory driver
    and `db diff` when a member installs `@electric-sql/pglite-postgis`.
  - `@stackra/gen`: the `geo` kind, mapped to `geography(<shape>,4326)` columns, entity column types and the schemas.

### Patch Changes

- d25a7a0: An action or query whose only actor is anonymous now gets its HTTP route, served with `auth: false`, instead of no
  route at all. Only a call whose actors include no user, agent or anonymous caller (a system-only job) has none.
- 9feea9d: A dependency whose port the member injects from its `./contracts` entry stays fully hosted, so the port's drivers are
  wired. Before, a service that injected `FileSystem` from `@stackra/filesystem/contracts` and imported nothing else of
  the package was hosted contracts-only and failed at boot with `No driver is bound to FileSystem`. Only a dependency
  imported for its events and types goes contracts-only. The same holds for a port named in a `DriverName<Port>` config
  field: `DriverName<LogReporter>` from `@stackra/logger/contracts` lists `console` and `otlp` again instead of an empty
  enum.
- 00a2477: A service's wiring now binds the ports the action pipeline itself requires for what the service declares, not only
  the ports a constructor injects: `EventOutbox` for an integration event (own or hosted, which `ctx.publish` writes), a
  `meter` or `analytics`; `IdempotencyStore` for an action that is not `Idempotency.Never`; `DeviceSequenceStore`,
  `OfflineCapStore`, `ReviewItemSink` and `StepUpCheck` for `offline`, `offline.cap`, `accepts` and `stepUp`. Before, a
  service that only published through `ctx.publish`, or only declared `idempotency`, threw "… is not bound".
- 4242bbb: A tool's `idempotentHint` is set only when a repeat cannot run twice: a query, or an action whose `idempotency` is
  `Idempotency.Required` or `Idempotency.Derived` (ADR 0099 amendment of 2026-11-08). `Optional` runs a call without a key
  every time and `Never` ignores the key, so neither tells an MCP host that a retry is safe any more.
- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/money@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/support@0.21.0

## 0.20.0

### Minor Changes

- 6623da1: A dependency a member imports only through its `./contracts` entry is hosted contracts-only: gen carries its
  `src/contracts/` integration events (so the outbox and topic emitters know their wire names) and hosts none of its
  models, migrations, actions, drivers, roles or permissions. A dependency imported any other way is hosted whole, as
  before (STA-2567).
- 667a3b5: Every `registerActions` row now carries its output class, so the action pipeline can leave `@ShownOnce` fields out of
  the idempotency store. The new warning `secret_output_kept` names an action that is not `Idempotency.Never` and returns a
  secret-named output field (`signingSecret`, `apiKey`, `accessToken`) with neither `@ShownOnce` nor `@Hidden`.

### Patch Changes

- a7b7e58: `@Replaces(Port)` now builds the replacement with its constructor dependencies: gen writes the replacement's
  constructor tokens on each `replaces` row (`deps`), and the container passes them, as it does for any driver. Before,
  the replacement was built with none and its injected fields were silently undefined.
- @stackra/money@0.20.0
  - @stackra/errors@0.20.0
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
- bac874e: The last Infisical uses in the developer packages move to sops and figentra/secrets (ADR 0525).
  
  - `stackra mcp exec -- <argv>` decrypts each `$NAME` the command names with `sops exec-env` from the `agents` scope of
    the local figentra/secrets clone (`$STACKRA_SECRETS_DIR`, default `~/.stackra/secrets`), one nested call per secret,
    instead of `infisical run`. Its `--env` and `--path` flags are gone; `McpExecOptions` is now `{ secretsDir? }`.
  - Mobile onboarding no longer writes the FCM key to a vault: it goes only to EAS, its one reader, and running the
    `push` step again replaces a lost key. `InfisicalVaultWriterDriver` is removed, and `MobileOnboardRequest` has no
    `vault` port. A missing root-kit name prints `pnpm secrets:put <NAME> --scope ci/production/store` as its owner step.
  - gen's `env` manifest rows no longer carry `home` (the Infisical folder `/runtime/<member>`), and the field is gone
    from the `StackraManifest` type; runway already ignored it. Products regenerate their manifests after the release.
  - `stackra dev --tunnel` names the sops way to start with `CLOUDFLARE_TUNNEL_TOKEN`, and the service template's
    `runway.yaml` header names figentra/secrets.
- 1cc3bd3: The write floor and the call-shape checks are staged. `action_risk_below_write`, `idempotency_missing`,
  `query_above_l1` and `step_up_missing` print as warnings in 0.19 and gen still writes; with `STACKRA_GEN_STRICT=1`
  they refuse, as they will everywhere from 0.20. Fix them in each product before 0.20.
- afd7846: Gen has warnings: a `GenError` with `severity: "warning"` prints as `<at> warning <code> ...` with its fix, never stops
  gen writing, and comes back in `warnings` from `generateMember` and `generate`; `stackra gen` and `stackra gen --check`
  print it and exit 0, while an error still exits 1. ADR 0101's checks run in the full pass as the new exported
  `checkActionFirst`: `action_without_workflow` warns an action that takes another service's client, a sibling module's
  service or `ConnectionStore` and starts no workflow, and `workflow_without_action` refuses a controller, command or
  listener that takes a workflow or `WorkflowRunner`, or starts a workflow itself. The source reader records the
  workflows a class starts as `DeclaredClass.workflows` (STA-340).
- 0da5f7a: Step-up works out of the box (STA-340). `@stackra/identity` ships `IdentityStepUpCheckDriver`, the `identity` driver of
  the actions pipeline's `StepUpCheck` (`requireAssurance` with `IdentityConfig.stepUpMaxAgeMinutes`; a call without
  assurance is refused). gen binds it by default in every service that declares `@stackra/identity`; a host without
  identity binds none and its step-up actions still fail closed. `@stackra/actions/testing` adds
  `MemoryStepUpCheckDriver`, picked by `.useDrivers("memory")`: a test passes `assurance` at the declared level to
  `run`, and a call without it is refused `step_up_required`.
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

- ee00741: A host's wiring no longer binds `DiscoveryService` (or `Container`), which the container builds itself: a service that
  injects it only lists it among the `platform` classes. The binding gen wrote had `deps: [Container]`, whose constructor
  is private, so the host's build failed with TS2322 (commerce stock).
- 5830168: The generated tenant-isolation test now reaches the services it missed (tenancy audit 2026-11-07, section 6). gen
  writes it for a service whose owned tables come only from the packages it hosts (their manifests' models with
  `BelongsToTenant` or `BelongsToTenantOrPlatform`), not just for one with an owned model of its own. And gen writes
  `.stackra/vitest.int.config.ts` when it emits an `.int.test.ts` under `.stackra/tests/`, so a member with no authored
  int test can run gen's test through `stackra test --tier int`.
- ef04935: `model_tenancy_missing` now checks packages too (tenancy audit 2026-11-07; ADR 0210 amendment). A package model that
  is neither `BelongsToTenant`/`BelongsToTenantOrPlatform` nor `Model.global(...)` prints a warning in 0.19 and will be
  refused from 0.20. A table an ADR names is skipped (today `achievements.award_verifications`, ADR 0368 decision 5).
  The new staged check `model_tenancy_migration_missing` warns when an owned model's table is created or altered by the
  member's migrations but none of them calls `t.belongsToTenant()`; it refuses under `STACKRA_GEN_STRICT=1` and from
  0.20.
- 0921f1f: `Idempotency.Never`: an action whose output must never be kept (a credential) ignores a sent `Idempotency-Key`;
  every call runs and nothing is stored in or replayed from the idempotency store. `HttpDevicePairingDriver` sends no
  `Idempotency-Key` on the credential pickup (`hubSender(config, credential, { idempotencyKey: false })`), so the hub
  never keeps the answer that carries the token.
- dd9427a: `assertRowSecurity` now audits every table, not only those holding the owner column: a table without it fails unless
  `PLATFORM_TABLES` (the migration ledger, the action store, cache and lock tables) or the new `platform` option names it
  with a reason. An owned table must have exactly one permissive policy, `pol_<table>_<column>`, the `FOR ALL` owner
  equality, and only restrictive policies named after their column beside it (ADR 0347 decision 5). The probe seeds a
  row of each owner itself, so the cross-owner read always runs, and also checks that an unset setting sees no row and
  the owner sees its own. gen's generated tenant-isolation test passes the service's `Model.global` tables and
  `MODEL_SCOPE_EXEMPTIONS` as `platform`. A table under a scope-path policy with no `tenant_id` now fails the audit.
- fc845f4: `assertRowSecurity` stages its every-table check like gen's tenancy checks. Until 0.20, an unlisted table without the owner column is a warning, not a failure. `assertRowSecurity` now returns these warnings. Each one names the table's group, read from the catalogue:
  
  - an ancestor `scope_path` table awaiting the contract step;
  - a `scope_id` table whose policy reads the owner setting;
  - a system table with no row-level security, awaiting its ADR decision;
  - otherwise, unclassified.
  
  With `strict: true` or `STACKRA_GEN_STRICT=1`, these tables fail the audit as they will from 0.20. Every other finding still fails at once: the policy shape of an owned table, the probe's checks, a listed table that holds the column, and a listing with no reason.
  
  gen's tenant-isolation test now prints each warning and passes when the audit returns only warnings.
- Updated dependencies [58e3066]
- Updated dependencies [bac874e]
  - @stackra/contracts@0.19.0
  - @stackra/money@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/support@0.19.0

## 0.18.1

### Patch Changes

- 2a7bc6d: A service that hosts a package with a searchable model (`@stackra/loyalty-kit`'s `LoyaltyAccount`) now derives
  that model's `Search<Model>Query` into its own `#stackra/search` and imports it from there. The package's own copy
  lives in its unpublished `.stackra/gen`, so the host's registrations used to import a class the package does not
  export (TS2305).
- @stackra/money@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/support@0.18.1

## 0.18.0

### Minor Changes

- 79dcafb: A service must declare `encore.dev`: gen refuses one whose generated Encore files import it undeclared
  (`generated_dependency_missing`), since Encore Cloud installs it from the service's package.json when it builds the
  deploy commit. Add `"encore.dev": "catalog:"` to each service and `encore.dev: 1.58.8` (the Encore CLI version) to the
  catalog.

### Patch Changes

- @stackra/money@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/support@0.18.0

## 0.17.2

### Patch Changes

- 2da4d9d: Fixes from typechecking os on 0.17.1. Runway's eleven commands and `stackra runway` are `bin` commands, so no member
  hosts them (their classes are not exported from `@stackra/runway/node`), and gen hosts console commands only from a
  member's runtime `dependencies`, never its devDependencies. A hosted package's entities carry no `~defaults` marker its
  published types lack, and a package-base override no longer imports a field hatch it does not use.
- @stackra/money@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/support@0.17.2

## 0.17.1

### Patch Changes

- @stackra/money@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/support@0.17.1

## 0.17.0

### Patch Changes

- @stackra/money@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/support@0.17.0

## 0.16.0

### Minor Changes

- 64cfc1d: Cross-app events (ADR 0511 decisions 11 to 19, STA-1910). Gen lifts `client_event_remote_transport`: a listener of a
  contract-only producer's event is registered like a sibling's and delivered through a generated inbox, never an
  Encore subscription. Such a service gets `#stackra/inbox` (`InboundEventsController` on `POST /events/inbox` over
  `RelayInboxService`, and `RelayInboxConfig` with the pinned producers' public keys and events), its Encore `api.raw`
  adapter (`.stackra/encore/<member>/inbox.ts`, exposed, `auth: false`) and the boot's `RelayInboxService` connect. A
  service whose `runway.yaml` has an `events` block gets the manifest's `relay` section (keys and subscribers per
  environment, no origins), an `env` row for its signing key's secret name, `#stackra/events-relay`
  (`EventsRelayConfig` picked by `STACKRA_ENVIRONMENT`), the wiring of `CrossAppFanOut`, `CrossAppRelayService` and
  the Postgres `DeliveryDriver`, and the cross-app relay loop in its boot. The new warning `client_event_unsubscribed`
  names a listener whose producer's contract does not list the service for that event; `GenerateResult.warnings`
  carries it and `stackra gen` prints it. Members with neither keep the same output.

### Patch Changes

- 6ed8ab1: `stackra gen` refuses `module_key_collision` when a declared package's migrations need a module key that one of the
  member's own modules with migrations also has, instead of resolving the need to that module and reporting a
  cascade of `migration_cycle` errors. A member module that only shares a package's key stays allowed.
- c6e4715: `#stackra/settings` keys a section's field `<section>.<name>`, so two sections of one module may share a field name
  without a duplicate key (TS1117). `settingKeys` strips the section back off: each key keeps its `name` and its
  `<module>.<section>.<name>` path, and files written by an older gen still work.
- 5bf8ad3: Fixes from the os 0.14 typecheck. Gen reads a trait's enum, `Translated`, list and prefix-less `PublicId` fields by
  their types instead of `json()`. A declared contract package wins over a same-named sibling service folder. A hatch
  import named like an `X$` the schema file declares comes in aliased. In validation, `Fields`/`InputFields` stop
  recursing on `Json`, drop every `~` brand key (a config's `~kind` and `~config`), and `Same` compares readonly arrays
  at any list-view depth.
- @stackra/errors@0.16.0
  - @stackra/money@0.16.0
  - @stackra/contracts@0.16.0
  - @stackra/support@0.16.0

## 0.15.0

### Patch Changes

- @stackra/money@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/support@0.15.0

## 0.14.4

### Patch Changes

- @stackra/money@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/support@0.14.4

## 0.14.3

### Patch Changes

- @stackra/money@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/support@0.14.3

## 0.14.2

### Patch Changes

- @stackra/money@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/contracts@0.14.2
  - @stackra/support@0.14.2

## 0.14.1

### Patch Changes

- @stackra/money@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/support@0.14.1

## 0.14.0

### Patch Changes

- @stackra/money@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/support@0.14.0

## 0.13.0

### Patch Changes

- @stackra/money@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/support@0.13.0

## 0.12.0

### Patch Changes

- @stackra/money@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/support@0.12.0

## 0.11.1

### Patch Changes

- @stackra/money@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/support@0.11.1

## 0.11.0

### Patch Changes

- @stackra/money@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/support@0.11.0

## 0.10.0

### Minor Changes

- e57b9a1: `stackra gen` writes an `env` section into `stackra.manifest.json` (ADR 0173 amendment 2026-11-04, STA-2104): one
  row per environment name the member's configuration classes declare (`Config({ env })` names and `@Secret` fields),
  with its kind (`secret`, `public`, `config`), type, rules, refused prefixes and environments; a service adds its
  hosted packages' rows, an app only their public rows, and each gets the Infisical path `/runtime/<member>`. `@Secret` takes an optional second
  argument, `{ refuse, environments }`, read by gen. `StackraManifest` types the section.

### Patch Changes

- 05da3d4: An action is never advertised to MCP clients as read-only, even at L0 or L1; only a query at L0 or L1 is.
- 242ebe4: The migration compiler's macro recorder and two tests typecheck again under `exactOptionalPropertyTypes`.
- Updated dependencies [e57b9a1]
  - @stackra/contracts@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/money@0.10.0
  - @stackra/support@0.10.0

## 0.9.0

### Minor Changes

- 3db6529: The docs-site target can now write a Fumadocs site. `emitDocsSite(input, "fumadocs")` prerenders the site to static files with Vite and React Router. It writes the pages under `content/`, the navigation as a page tree in `app/site.json`, the site shell, `llms.txt`, `llms-full.txt` and `_redirects` under `public/`, and a transitional map for the Mintlify component names. It refuses a redirect from a page's own path (`docs_redirect_shadows_page`), a redirect to nowhere (`docs_redirect_target_missing`) and an unmapped, unimported component (`docs_component_unknown`). `DocsConfig` gains `redirects`. Mintlify stays the default until a docs app switches (STA-2026). For a docs member whose generated site is Fumadocs, `stackra dev` and `build` run React Router, and they name `pnpm install` when the site's dependencies are missing. `stackra lint` builds the site, then checks every internal link, image and anchor in it, and exits 1 naming each broken link by page.
- c19ca9c: Gen records each record `Policy<Model>` in a manifest `policies` section (class, model, module, file and the model's
  `modelFile`, own then hosted with `from`, written only when there is one), writes `registerPolicies([...])` in
  `#stackra/registrations` from it, and a service's boot calls `connectPolicies(container)`. Until now nothing paired a
  model with its policy, so `ctx.authorize(record)` ran no policy and a caller holding a permission could act on another
  principal's record, such as another customer's loyalty account (STA-2045).
- 502cba1: A service's generated Encore app gains its service declaration and its endpoints. Every service gets
  `.stackra/encore/<member>/encore.service.ts` (`export default new Service("<member>")`), and a service with an own
  action or query that has an endpoint gets `.stackra/encore/<member>/api.ts`: one `api()` per such entry, with its
  derived method and path, typed by its input and output schemas, running the call through
  `ActionPipeline.execute` inside `app.handlers.run`.
  
  The actor comes only from Encore's verified auth data (`getAuthData()` of `~encore/auth`, `{ userID, actor }`). An
  endpoint is `auth: true` unless its call lists `ActorKind.Anonymous` in `actors`; that one is `auth: false` and runs as
  an anonymous actor when no session is presented. The auth handler that returns the auth data comes with the generated
  gateway; until then `encore build` refuses the `auth: true` endpoints. A hosted package's entry, and one whose schema
  the member does not declare, get no endpoint yet. Gen now refuses a route whose path parameter is no field of the
  input (`endpoint_param_unbound`), since Encore binds path parameters from the input.

### Patch Changes

- b210fc8: A service that runs `@stackra/outbox` now connects the outbox writer as the native-write watcher in its generated
  `boot` (`connectNativeWriteWatcher`), so a native `CrudService` write (increment, soft or archive delete, restore,
  repath, purge) reaches the change log, and search indexes, segments and `@ConsumesChanges` consumers no longer keep
  stale or deleted rows (STA-2047).
- e80a99b: `stackra gen --check` locks permissions, roles, config keys, schema names, endpoints and reports (`identity_changed` unless `@Renamed` names the old identity), and accepts an integration event version bump; `@Renamed` may mark a report class.
- c00ae11: Migrations apply after the modules they depend on and after the owner of each macro they call (ai after tenancy); a migration that imports anything but `@stackra/database` or `#stackra/migrations` is refused (`migration_import_forbidden`); a service's own macros are merged into `Blueprint` through the generated `.stackra/gen/blueprint.ts`.
- 94354cc: The generated public SDKs: the TypeScript client now requests the base URL plus the endpoint path, so a base URL with a
  path prefix (`https://example.com/api`) keeps it, as the Python and PHP clients already did; a host-only base URL
  requests the same URL as before. Every write in the TypeScript, Python and PHP clients now sends an `Idempotency-Key`:
  the caller's when passed, else a UUID v4 generated once per call before the request (`crypto.randomUUID()`,
  `uuid.uuid4()`, `random_bytes`), so a retry around the request replays one call. A `GET` sends none. A TypeScript
  runtime without Web Crypto passes `idempotencyKey` on writes.
- dbe1e9d: Gen writes `.stackra/gen/ui.ts` (`#stackra/ui`) for a member that declares `@stackra/ui`: it re-exports `Component`
  from `@stackra/ui/native` on an app that renders only on iOS and Android, and from `@stackra/ui/react` otherwise. A
  class component (`class Greeting extends Component<GreetingProps>`) now type-checks; the class-components compiler
  still removes the import before a bundle loads it. The `.` entry exports the emitter as `emitUiFacade`.
- b174a17: `stackra db diff` reports pivots, search columns and partial indexes faithfully. `expectedSchema` now expects each
  many-to-many relation's pivot table, named by `pivotTable` or `<table>_<field>`, with the two `varchar(33)` keys the
  ORM names (`<owner>_id` and `<target>_id`, or `<table>_1_id` and `<table>_2_id` for a self-reference), the owner's
  `tenant_id` and their same-module foreign keys, so a migrated pivot is no longer `undeclared_table`. A `@Searchable`
  model expects `search_text` and `search_filters`; `diffSchemas` tolerates the search vectors and `__v<n>` shadows only
  on such a table and reports search columns on any other table as `undeclared_column`. A partial index's predicate
  compares as Postgres renders it (multi-word and array casts, quoted identifiers, `<>`, `= ANY`, `<> ALL`, `~~` and
  `between` folded), so a correct partial index is no longer `index_shape`.
  
  `ManyToManyOptions` documents the pivot name the ORM uses without the option, `<table>_<field>`.
- 2ae4f65: `sort_not_indexed` and `filter_not_indexed` now judge the resource trees gen reads in this run, not the committed
  `stackra.manifest.json`. A sortable column, default sort, tiebreak key or filter on a path no index leads with is
  refused in the run that adds it, including a first run with no committed manifest; a tree only the committed manifest
  still holds is no longer judged. `checkTableIndexes(ir, manifest)` takes the manifest this run derives.
- f9c825d: gen binds Menu, Shortcut, Store, Bridge (request-scoped) and ExtensionPoint classes; a config override keeps its base's key. The container's binding kinds gain `shortcut` and `extension_point`.
- Updated dependencies [2e43c48]
  - @stackra/contracts@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/money@0.9.0
  - @stackra/support@0.9.0

## 0.8.0

### Patch Changes

- 928dcc0: A service's generated `boot` now calls `connectVisibilityFilter(container)` beside the hold registry and sequence time
  zone, so reads AND the bound `VisibilityFilter`'s conditions, `UserStamps` take the running call's actor, and
  `callTimeZone()` reads the call's time zone; until now nothing outside tests connected it, so record visibility, user
  stamps and the call time zone were all off (STA-2044). The database testing plugin connects the compiled app the same
  way on every compile, and the memory database runs the `StampSubscriber`, so unit tests see what production does.
- 7dd35b3: A member's generated Vitest setup imports each generated schemas file statically and calls the new
  `markMemberSchemasLoaded()` from `@stackra/container/testing`, instead of awaiting `loadMemberSchemas()`. In a
  consumer, `@stackra/container` sits in node_modules, which Vitest leaves to Node, so the schemas loaded through Node:
  with no `#` imports-map fallback and no legacy decorators, every unit test failed at import (STA-2032).
- @stackra/money@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/contracts@0.8.0
  - @stackra/support@0.8.0

## 0.7.1

### Patch Changes

- 448c52f: Gen writes `.stackra/gen/i18n.ts` before it loads a member's resource classes, so a resource that takes its labels
  from `#stackra/i18n` loads on a clean checkout instead of being refused as `resource_unloadable` (STA-1947).
  
  The shared walk over a host's dependency manifests is renamed `dependencyContributionsOf` (was `contributionsOf`), so
  it no longer shares a name with `@stackra/navigation/testing`'s `contributionsOf`.
- @stackra/money@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/support@0.7.1

## 0.7.0

### Patch Changes

- @stackra/money@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/support@0.7.0

## 0.6.1

### Patch Changes

- @stackra/money@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/support@0.6.1

## 0.6.0

### Minor Changes

- 71bbf08: An app that hosts `@stackra/panel` now composes the panel resources its dependencies record: its route tables register
  the trees on native as well as the browser, and gen writes `#stackra/resources` (`Resources` and `resourceList`), each
  resource's route constants with the operation refs its consumed services' clients export. One resource key from two
  classes is refused (`resource_duplicate`). A page whose operation no consumed service's client exports gets no route
  and is listed with its reason in `unboundOperations`; a `true` list or get waits on STA-1971. The walk over the dependencies' manifests is the shared `contributionsOf` step (STA-1947).
- 99750d4: A package records the `Route` and `Menu` classes of its `react` and `native` entries in its manifest (`ui.routes`, with
  the page beside each route, and `ui.menus`), and an app's route tables list them on the runtime their entry serves,
  imported from `<package>/<entry>`, so no app hand-writes a `register()`. Every menu, the app's own and its packages',
  is registered under its key through the new `registerMenus` of `@stackra/navigation`, and `useMenus(kind?)` lists them
  for a shell. One route or menu key from two owners is refused (`route_duplicate`, `menu_duplicate`) (STA-1947).
- e15d9c3: Gen records every panel resource in the manifest's `ui.resources`, under `<module>.<model>`: the tree its builder
  members return, with its owning `module`, its `class` and, in a package, the `from` a host imports it from. Action
  and query classes in the tree are written as their locked keys, and a service or app also lists its hosted packages'
  resources. `generate` takes a `loader` to run the resource classes; `stackra gen` passes one on Vite's module runner,
  and a run without one refuses a member that declares a resource (`resource_loader_missing`). New refusals:
  `resource_unloadable`, `builder_impure`, `resource_operation_unknown` and `resource_duplicate` (STA-1947). The loyalty
  kit's manifest now records its `LoyaltyAccountResource`.
- e250d4f: Gen writes one `registerActions([...])` in each member's `#stackra/registrations`, a row per action and query with its
  locked key, permission, risk, effects and input schema, so the pipeline validates input and checks the permission of
  every call. `IamAccessControlDriver` now refuses a call with no registered permission instead of letting it through,
  and lets an anonymous caller past `require` and `authorize` only for a class whose `actors` list `anonymous`; the
  manifest marks such a call `anonymous: true` and its OpenAPI operation takes no security. `stackra validate` lists
  every anonymous-callable call, and a test pins today's five (STA-2025).

### Patch Changes

- f0478cd: A service's generated entity schema lists the `"~defaults"` marker the schemas file adds as a non-persisted property,
  which `EntitySchema<T>` requires (TS2741 in `.stackra/gen/entities`); a package's committed entity list does not, since
  its model type has no such key. The `service` preset turns `declaration` off (a service publishes no `.d.ts`, and the
  entity schema types name `EntityCtor` from @mikro-orm/core, which a service cannot name: TS2883), and is tested to keep
  `.stackra/encore` out of the typecheck (STA-1894, STA-1880).
- 0090b9c: A `?:` field whose `@Field(zod)` hatch already ends in `.optional()` compiles to `.exactOptional()` instead of
  `.optional().exactOptional()`. The latter's output admits `undefined`, which `?:` under `exactOptionalPropertyTypes`
  does not, so the schema's `$Check` failed with TS2344 in every consumer that wrote such a hatch (STA-2022).
- b98f7ea: Gen recognises a package's migration macros whichever peer-variant copy of `@stackra/database` they extend: a macro is a
  class whose chain reaches the `Macro` kind base and that implements `apply`, no longer `instanceof` the member's own
  copy, which silently dropped them (`t.belongsToTenant is not a function`). A migration that calls a blueprint method no
  macro supplied now names the macros gen collected in its `migration_compile_failed` message (STA-2006).
- @stackra/money@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/support@0.6.0

## 0.5.1

### Patch Changes

- @stackra/money@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/support@0.5.1

## 0.5.0

### Patch Changes

- @stackra/money@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/support@0.5.0

## 0.4.0

### Minor Changes

- 0b660e0: The schemas file now augments each shape that has initializers with `declare module "<its import path>"`, naming them in
  the type-only `~defaults` brand (STA-1694), so `CallInput` can make the defaulted fields optional. Regenerate to pick it
  up.
- 3ce01cf: A package's entity list is a committed generated contract, `src/node/entities.gen.ts`, written by `stackra gen` and kept
  fresh by `stackra gen --check` (ADR 0294 R10 and ADR 0295, amended 2026-11-01, STA-1874). Each package's `./node` now
  ships its `<KEY>_ENTITIES` inlined in the build instead of importing the gitignored `.stackra/gen/entities/` at runtime,
  which failed: the 0.3.0 builds of these packages carry that broken import until this release. `stackra validate`
  expects the re-export from `#node/entities.gen`, and the doc standard skips `*.gen.ts` files.
- 9c8d108: Packages contribute console commands, and gen collects them per member (STA-1731). `@stackra/console` audits a
  command declared `audit: true` through the `CommandAudit` port (refused before it runs when no sink is ready; secret
  values redacted). gen records commands in the manifest, merges hosted packages' commands, refuses
  `command_collision`, and writes `#stackra/commands` and a console entry that `stackra console <member>` runs. First
  commands: `db:migrate`, `db:rollback`, `db:status`, `db:seed`, `tenant:list`, `tenant:create` (with a
  `TenantDirectory` port), `cache:clear` (the `Cache` port gains `flush`), `queue:work`, `queue:failed` and
  `queue:retry`; `@stackra/access-log` stores command audit entries (`STACKRA_COMMAND_AUDIT_SCOPE`).
- 1c22c33: `stackra db seed` runs a service's seeders: gen writes `.stackra/entry/seed.ts` (boot, direct database url, no relay loop), `runSeeders` runs `minimal` then the profile, each seeder built by the container in its own transaction with a seed ledger row, skipping a seeder whose source is unchanged (`--again` re-runs). Production refuses `demo`, `test` and `--again` without `--allow-production` and records who ran it. `stackra seed-pack` runs the same step after its records. A service's `boot` takes `url` and `relay` options.
- c9cf778: Add the approval stage gen refusals (STA-1724, ADR 0509): `approval_not_constant`, `approval_on_query`,
  `approval_window_too_long`, `approval_actor_not_allowed`, `approval_credential_input`,
  `approval_condition_dependency` and `approval_condition_reads_unmarked`, and the `approval_condition` kind
  (`access/<name>.approval-condition.ts`).
- aa21e6b: Gen reads a consumed service from a sibling folder or from a dependency whose `package.json` has `stackra.kind`
  `contract` (a producer's published `stackra.manifest.json`, OpenAPI and lang, no source) and whose manifest `member` is
  the service, never by matching a dependency's member name, which could pick a package's manifest for a service of the
  same name. A contract package is never hosted. Its client and lang are generated; a listener of its events is refused
  with `client_event_remote_transport` until the event-transport ADR. `StackraKind` gains `contract` (a new kind, so
  skills is minor); `stackra add` does not offer it; repo-checks asks a contract package only for its kind and manifest.

### Patch Changes

- b99d4af: Gen's output now typechecks in consumers. The generated member module aliases a dependency's module class that shares
  the member's own name (`PaymentsModule as StackraPaymentsModule`); a model that writes its own `[OptionalProps]` gets no
  generated one that would redeclare it (TS2717); and a client leaves out an enum's schema constant nothing reads
  (TS6133 under `noUnusedLocals`).
- b531c97: A generated schema's `X$Check` leaves out its driver-name fields on both sides: `DriverName<Port>` widens to every
  registered driver name when the port has no `~key` brand, so a shape with one failed `Same<>` (TS2344). The `X$`
  schema still validates the field with `z.enum` of the driver names gen found.
- 0cf32d7: A service with a database gets `.stackra/gen/encore-sqldb.d.ts`, the `encore.dev/storage/sqldb` types its boot's
  import of the generated Encore database file needs, so the service typechecks without `encore.dev` installed (TS2307,
  STA-1795). The Encore app under `.stackra/encore` keeps the real types.
- 457b107: A package with nothing to export yet gets an empty `.` entry (`export {};`), so its build makes an empty
  `dist/index.mjs` instead of tsdown falling back to `src/index.ts` and failing (STA-1753).
- 4561f10: A service now registers its hosted packages' permission sets and module roles at boot, not only its own. Manifest permission entries carry `module`, `member` and `file`, and a new `roles` section lists each module role with its key, so the host can import and register them. Regenerate committed manifests.
- 823d985: A package or service with an `.int.test.ts` under `src/` also gets `.stackra/vitest.int.config.ts`, the generated unit
  config narrowed to the integration tier with `intTier`, which `stackra test --tier int` runs; no member authors a
  `vitest.int.config.ts`.
- d675b4d: `@stackra/gen/node` exports `checkMigrationDrift(root)`: it compiles a service's migrations, replays them through the
  member's own `@stackra/database/node`, builds the schema its models declare and returns their differences. The `.`
  entry exports the pure parts: `expectedSchema` (tables, columns, nullability, `@Index` indexes under their `idx_`
  names, `fk_` foreign keys), the field-to-Postgres type map `postgresTypeOf` with `postgresTypeAgrees`, `diffSchemas`
  and `formatSchemaDifference`. A class facet now records its constant arguments after the first as `rest`, so
  `@Index(["a"], { unique: true })` keeps its `unique` and `where`.
- ca7d004: The wiring file also writes `interface PortRegistry` (port key to `typeof <Port>`) beside `DriverRegistry`, so
  `DriverName<Port>` narrows without a brand on the port. A hand-written `~key` brand that is not `<member>.<Port>` is
  refused with `port_key_mismatch`.
- 1856ee0: The generated entry imports `registerPermissions` from `@stackra/container`, so a member that declares permissions but no
  roles no longer imports `@stackra/iam`; `registerRoles` still comes from iam (STA-1890, ADR 0513).
- d0b1ef3: The generated registrations call `registerPermissions` for every `Permission` static (`.system()` and `.restricted()` ones included) and then `registerRoles` for every module role, so a real boot knows which permissions are system-only or restricted and what each module role holds. `Permission.Lx.restricted()` statics are now read into the manifest too.
- 3400ff6: Gen's `registrations.ts` no longer imports an Integration that has no Connection: it was imported and never read, which
  failed a consumer's `noUnusedLocals` (TS6133).
- 13b7dff: A service's full run refuses `queue_unprovisioned` when an environment in its `runway.yaml` has no `queues.<name>`
  entry for a queue its job actions run on, `default` aside (STA-1727). A member with no runway file or no environment
  is not refused.
  
  **Upgrading:** a product whose services run job actions on a named queue must add that queue under every environment
  its `runway.yaml` declares, `environments.dev` and `environments.preview` included, before `stackra gen` passes on
  this release:
  
  ```yaml
  environments:
    dev:
      queues:
        invoices:
          visibilityTimeoutSeconds: 300
    preview:
      queues:
        invoices:
          visibilityTimeoutSeconds: 300
  ```
- dbb60dc: A settings section (a schema-typed field with no initializer) is emitted `.prefault(() => ({}))` in `#stackra/schemas`,
  so a group with no stored value for a section reads that section's field defaults instead of throwing a ZodError. A
  wrong-typed stored value is still refused. Run `stackra gen` to regenerate.
- bb08f25: `MemoryDimensionValuesDriver` is the `memory` candidate of `DimensionValues`: a consuming service projects the values the owning service's events make live (`project`, `retire`); nothing is live until projected. Gen binds the workflow node's `ServiceAckService`, `AutomationService` and `ChecklistService` where a member injects them and registers their model partners, as it does `RuleSetService`.
- 5f63e58: `Integration({ key })` takes an optional written key of two snake_case parts (`connectors.stripe`), for an Integration
  whose key stored data already names (STA-1739). Gen's manifest uses it in place of the derived
  `<module>.<snake(class)>`, refuses a malformed one (`integration_key_invalid`) and still refuses two Integrations with
  one key (`identity_collision`). Without `key`, nothing changes.
- Updated dependencies [9c8d108]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [58c7da9]
  - @stackra/contracts@0.4.0
  - @stackra/support@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/money@0.4.0

## 0.3.0

### Minor Changes

- 23e556c: New check `credential_field_not_encrypted`: a `@Classified(DataClassification.Credential)` field must be named by `HasEncryptedFields` (STA-1677, ADR 0494).
- ccc0b0f: Add the client tool target (STA-1631, ADR 0490): `emitClientTools` writes `#stackra/client-tools` for an app from its
  routes, the panel resources of its dependency manifests, placed action prefills, theming previews, tours and anchors,
  grouped by declaring module. Refuses `client_tool_collision`, `prefill_tool_off`, `anchor_undeclared` and
  `context_record_not_public_id`. Adds `anchors` and `anchorReferences` to `MemberIR`, read by `readAnchors`.

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- d0569d2: A service's generated `boot` connects `AutomationService` to the container when the service runs `@stackra/workflow`
  (STA-1699, ADR 0495), so publishing an automation checks its principal's scope through `ScopeOwnership`.
- 4bdb23b: `gen --check` passes on a clean clone: a generated file that is missing is drift only when the member commits it
  (`stackra.manifest.json`, `openapi.json`), so gitignored `.stackra/` output and root shims no longer fail the check
  before gen has run (STA-1742).
- d05f876: `egressOf` accepts a `baseUrl` that is exactly one camelCase `{field}` (STA-1665): the egress entry is
  `{ origin: "{field}", fields: ["field"] }`, and the managed client checks the resolved URL at run time. Every other
  refusal is unchanged.
- c9296d9: A class whose shipped `.d.mts` base is typed `import("@stackra/config").ConfigClass<…>` keeps its kind: the reader
  takes the import type's qualifier when the base has no type name (STA-1738).
- 8dead7a: <!-- Purpose: release note for the typed queue registry. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0148; STA-1723. -->
  
  Gen writes `#stackra/queues` for a service with a job action: `Queues`, built with `queues()` of `@stackra/queue` over
  the queues its job actions name and `default`, so a job writes `queue: Queues.Billing` and a queue no job names any
  more is a type error. The reader reads `Queues.<Name>` before the file exists.
- 499effb: A service's generated `.stackra/tsdown.config.ts` annotates its default export `ReturnType<typeof library>`, like a
  package's already does, so it no longer fails typecheck with TS2883 when tsdown is not the service's own dependency
  (STA-1743).
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/money@0.3.0
  - @stackra/support@0.3.0

## 0.2.0

### Patch Changes

- 9a2a6b0: `stackra gen` now compiles the migrations of packages installed from the registry. They ship as TypeScript source under
  `node_modules`, where Node refuses to strip types, so gen failed with `migration_load_failed` in every product service
  that depends on a package with migrations. `loadSourceModule` strips such a file into `.stackra/cache/sources/` and loads
  that copy, which resolves `@stackra/database` from the member root.
- bab9fe1: A package gets a gitignored root `tsdown.config.ts` shim re-exporting the generated config, so plain `tsdown` runs from
  the member root, where `.stackra/entry/*` resolves (with `--config .stackra/…` tsdown took `.stackra/` as its cwd). The
  generated Vitest config passes with no tests only for a member with no source (fresh from `stackra new`); a member with
  source and no tests still fails.
  
  A package's entry barrels skip files directly in `src/`: those are hand-written entries a package.json export names (an
  OS shell's `register`), and two of them re-exported from `.` collided.
- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/money@0.2.0
  - @stackra/support@0.2.0

## 0.1.0

### Minor Changes

- 0abe92d: A service's generated `#stackra/boot` now connects `EventBus` (when the service runs `@stackra/events` or
  `@stackra/outbox`) and `InboxService` (with `@stackra/outbox`) after the container is ready, and disconnects both
  when the shutdown signal aborts, so registered listeners, consumed-event subscribers and relays receive events. Add
  `EventBus#disconnect` (removes only the subscriptions `connect` made) and `InboxService#disconnect` (drops the relays).
- 94ae85f: `AppendOnly` is enforced (stackra-256). `CrudService` refuses `update`, `increment`, `delete`, `restore` and `repath`
  on an append-only model with `AppendOnlyWriteError`; `purge` and `forceDelete` still remove rows for retention and
  erasure. `AppendOnlySubscriber` refuses a flush that changes a loaded row, and the generated boot adds it.
  `t.appendOnly()` revokes `UPDATE` on the table from `public` and the migrating role, and gen refuses an own
  `AppendOnly` model whose table no migration revokes it on (`append_only_not_revoked`).
- 62c7ae1: Pool budget wiring and a direct URL (ADR 0473, stackra-254). `DatabaseConfig.pool` (`max`, `min`, `idleTimeout`)
  sizes the pool of one instance and `PostgresDatabaseDriver.connect({ pool })` hands it to MikroORM for the primary and
  each replica. The generated boot passes it, with `DATABASE_POOL_MAX` over `max`; runway's `poolMaxOf` gives that share
  of the service's `poolBudget`. The migration and seed runners connect with `directDatabaseUrl()`
  (`DATABASE_DIRECT_URL`, else `DATABASE_URL`), so they never go through a transaction-mode proxy.
- 37e1aa8: Docs site target (stackra-176): gen assembles a docs app's Mintlify root into `.stackra/site` from a typed `DocsConfig`
  (pages in `src/docs`, assets in `src/assets`, snippets in `src/snippets`) with the `docs_*` refusals; `stackra
  dev|build|lint` run Mintlify in the generated site; runway's `MintlifyProviderDriver` (now a `Driver(RunwayProvider)`,
  so runway depends on `@stackra/container`) publishes it as an orphan commit to `targets.mintlify.branch`.
- c857043: Gen merges the `assets/lang` of every service a member consumes through a client into `I18n` (loaders import the
  service's files relative to the member), so an app's `I18n.orders.*` resolves. `remoteShape` of `@stackra/clients` is
  a schema kind base: `PickType`/`OmitType`/`PartialType` of a remote shape and a form that extends one compile against
  the client class's `schema` static (`ShapeIR.base` kind `remote`). `Settings.pick([...])` of `#stackra/settings` is a
  schema kind, so it is no longer `kind_unregistered_base`. A default naming a missing enum case is
  `shape_default_member_unresolved` instead of `shape_default_not_constant` (STA-1363).
- 0a38324: Gen writes the driver candidates of every declared package into the member wiring (memory, postgres and valkey alike),
  from the `classes` and `config` that package manifests now record, keeps an authored root `vitest.config.ts` that
  imports `./.stackra/vitest.config`, and the generated test setup loads `@stackra/clients/testing`. `@stackra/clients`
  adds a ClientFake-based memory `ClientTransport` (`CLIENTS_TESTING_PLUGIN`) and the `memoryTransport(app)` helper.
- 9fa326c: A service's gen run writes `.stackra/encore/encore.app` (`{ id, lang: "typescript" }`) from the root runway's
  `providers.encore.app`, so `stackra dev` (`encore run` in `.stackra/encore`) finds its app. A root runway without the key
  is refused as `encore_app_missing`; an `encore.app` at the member or repository root is refused as `encore_app_stray`
  (ADR 0091 decision 2, ADR 0029, STA-1322).
- 3840889: A service with a database gets `.stackra/encore/<member>/database.ts`, one Encore `SQLDatabase` over the compiled
  `.stackra/migrations` (ADR 0238, stackra-250). `#stackra/boot` now connects with that database's connection string
  instead of `DATABASE_URL`, passes the read replicas of `DATABASE_REPLICA_URLS` and the bound `DatabaseConfig`'s session
  timeouts, and adds `StampSubscriber`. The boot's options are `{ signal }`. New export: `emitEncoreDatabase`.
- 3730669: Emit a service's Encore CronJobs (`.stackra/encore/<member>/cron.ts`, ids by the new `cronJobId`) and broker-delivered
  queue topics and subscriptions (`queues.ts`); lock each Integration's egress entry, keeping a `{field}` host as data
  (`egressOf`, `egress_invalid`); refuse `sequence_misplaced` and `cron_job_collision`; connect the legal-hold registry
  and the sequence time zone in the boot; bind `SequenceService`, the floor-aware `SettingsReader` and
  `SettingsResolver` where injected.
- fb11778: A service's generated boot adds `new EncryptedFieldsSubscriber(container.get(FieldCipher))` to the database
  subscribers when any model, own or a declared package's, has `HasEncryptedFields`, so encrypted fields are never
  written in clear. New full-pass refusals (`checkEncryptedFields`): `encrypted_field_unknown`,
  `encrypted_field_unclassified` and `encrypted_native_write` (a native, query-builder or raw SQL write on an encrypted
  model). `FieldIR` carries the `@Classified` code (`classified`) and `MemberIR` the writes that skip the unit of work
  (`nativeWrites`) (stackra-262).
- f55eced: Write an app's Expo config (`.stackra/app.config.ts` and the root `app.config.ts` shim) from `defineApp`, the config
  classes, the lang and the brand kit's icon sets: identity, per-app languages and RTL, the passkey associated domain,
  expo-widgets with its app group and Live Activities, the alternate icons, the native share and spotlight plugins and
  the permission plugins. Refuses `expo_owned_key`, `expo_identity_missing`, `expo_permission_text_missing`,
  `app_icon_drift`, `app_definition_not_static` and an authored `app.json` or `app.config.ts` (`shim_authored`).
  
  One reader, `defineCall`, now reads the `export default define*` call for both the member facts and the Expo config,
  so a `defineApp(` quoted in a comment is never read and `area` and `targets` come from the top level only.
  `app_icon_drift` ignores the order `AppIconConfig.icons` lists the sets in.
- 165fae0: Register the generated report queries (`#stackra/reports`) and search queries (`#stackra/search`) like authored
  queries: each gets its manifest entry, derived endpoint, MCP tool and wiring binding (`reportQueriesOf`,
  `searchQueriesOf`), with the package input and output schemas under the module's `schemas`. The loyalty-kit manifest
  lists its `loyalty_kit.loyalty_account.search@1` query. The manifest records a query's `reads`, so a service's wiring reaches `ReplicaReads` for a hosted
  package's replica query too.
- a45aec8: Gen agrees with the `base-matches-suffix` lint (STA-1365). No `kind_unregistered_base` for a class extending `Error`
  (any `…Error`) in an `.error.ts` file, a base-less class in a `src/testing/` `.service.ts` harness, or a class under
  `// oxlint-disable-next-line stackra/base-matches-suffix -- reason: …` (`Container`, `ActionPipeline`). A driver of
  `@stackra/contracts` that extends its port is no `kind_suffix_mismatch` and has no constructor tokens. An abstract class
  is never `event_base_abstract` and its constructor is never read (no `token_not_a_class` for a protected base
  constructor); a class without a constructor now takes the nearest one its chain declares. `I18nKey` reads as the
  `i18n_key` string brand (a string column, `z.string()` cast to the brand). A member that declares packages without
  `@stackra/container` (`@stackra/testing`) gets no wiring, no member module and a container-free test setup, so no
  `generated_dependency_missing`.
- 727e5f7: A service's `stackra gen` now writes its compiled migrations to `.stackra/migrations/` (`compileMigrations`,
  `orderMigrations`, `emitMigrations`, `migrationId`): its own and its declared packages' migrations, compiled with the
  member's `@stackra/database`, ordered by module number and `Migration({ after })` across members, one `.up.sql` per
  step with its `.down.sql` inverse and the `-- stackra:transactional=false` header for online steps. Stale files are
  removed, and `gen --check` reports a stale, missing or leftover one (stackra-248, ADR 0159).
- 783fb5b: Read model additions (ADR 0336, stackra-64). A `ModelAddition(Base)` class in `models/<base>.model-addition.ts` is the
  `model_addition` kind (`<Base>Addition`); its fields are a shape. The manifest gains an `additions` section (base model
  key from the base's released manifest, side table `<module>.<addition>s`, wire key, fields) through `additionsOf`, with
  the refusals `addition_base_source`, `addition_target_missing` and `addition_key_collision`. The module's entity file
  writes a side-table `EntitySchema` per addition, keyed by the base record's id.
- 401d703: A host's wiring can now list the phone ports `AppLock`, `Passkeys`, `LiveActivities`, `DeviceSearchIndex`, `IncomingShare` and `AppIcon` with their config rows, defaulting to the Expo driver on an Expo-only app and to memory on the web and in a service. An app with both web and native targets gets a `nativeWiring` beside `wiring`, and its native entry uses it, so the phone takes the native drivers instead of memory. A host gets these rows only once the manifests of `@stackra/platform`, `@stackra/identity`, `@stackra/native-spotlight` and `@stackra/native-share` are regenerated to carry their driver tables and config rows; the committed manifests do not carry them yet.
- a3611b4: Gen reads the forms the OS gen pass refused: a bare `PublicId` (any prefix) and `PublicId<"a" | "b">` as the
  `public_id` kind with or without a decorator, `Readonly<Record<string, X>>`, imported regular expression constants,
  `Translated.of` defaults and `...this.<field>` spreads in override defaults, and a trailing `tool: false, // reason:`.
  `override_duplicate` applies only to real overrides (ADR 0305 rule 1), a query may take its own declared verb as its
  permission, and the member named after a package's module may host its model with the registered prefix (`hosts`).
  `TsHost` gains `trailing(node)`.
- 2562581: List declared rule outcome kinds in the manifest's `outcomes` section, locked by class; refuse a `@DocumentNumber`
  field whose sequence is not declared (`document_number_unsequenced`); spell the effect tag `external_communication`;
  register the workflow public-id prefixes `wfa`, `wfc`, `wfk` and `wfp` (STA-773, STA-756, STA-765, ADR 0425, 0342).
- 2c78113: The i18n target merges the `assets/lang` of every declared `@stackra/*` package into the member's `I18n`, keyed by the
  package namespace, scans `I18n.<namespace>.<path>` references (tests included) and refuses `i18n_key_missing` and
  `i18n_namespace_clash`. A shared `dependencyPath` resolves packages under `node_modules`.
- 2787c1e: Add `@stackra/gen`, the compiler of the programming model v3.1. Discovery reads a member's own source behind one host
  seam over the TypeScript 7 API (`typescript/unstable/sync`) with a TypeScript 6 fallback and no ts-morph, sorted by
  path: kinds from the `extends` clause, options as constants, partners from type arguments, constructor tokens,
  facets, `handle` shapes, refusals and shape fields with their rules and constant defaults. From that IR it derives
  every identity and writes the committed `stackra.manifest.json` (with `identity_collision`, `override_duplicate`,
  `permission_unknown`, `two_declarations_in_file`, `partner_mismatch`, the `shape_*` family and the `@Renamed` lock of
  `stackra gen --check`) and its `openapi.json` projection; the shape compiler (`X$`, `X$Check`, `{ input, output }` per
  action and query, `registerSchemas`); `#stackra/wiring` with the `DriverRegistry` augmentation; `#stackra/module`; the
  package entry barrels and the runtime entries. It ships the class-component compiler as a Babel plugin with
  `classComponents()` for Vite and the `@stackra/gen/metro-transformer` hook, and `./testing` helpers for contract and
  conformance tests (`loadManifest`, `previousRelease`, `expectBackwardCompatible`, `loadOpenApi`, `projectOpenApi`,
  `discoverWithGen`).
  
  The wave 9 catch-up adds the outputs the platform packages wait for: entity files with `[OptionalProps]` and
  `EntitySchema` read from each model's relations, initializers and getters; a service's registrations
  (`registerEntities`, `registerModelPartners`, `registerEventNames`, `registerJobs`, `registerScheduledJobs`,
  `registerConnections`, `registerWebhookEvents`, `registerOutboundWebhooks`, `registerSequences`,
  `registerSearchableModels`), `registerChanges` beside `registerSchemas`, its boot and inbound webhook route; wiring
  bindings for `repositoryOf(M)`, `journalOf(M)`, `IntegrationRuntime` and the platform services it injects; locked
  integration, sequence, block and route keys with the shared public id prefix registry; an app's route tables and
  block registrations per runtime; and the tool configs in `.stackra/`.
- ca33793: Add the `public` manifest flag and the public SDKs (OS ADR 0039): an action or query with `public: true` is recorded
  as `public` (refused without an endpoint, `public_without_endpoint`), and `emitSdks` writes TypeScript, Python and PHP
  clients for the public entries into `.stackra/sdks/`.
- c868bad: Wire the `@stackra/rules` node into a service that injects `RuleSetService`: the wiring binds it over
  `repositoryOf(Revision)` and the registrations write its `RuleSet` model partner (`PLATFORM_PARTNERS`). A
  `PLATFORM_BINDINGS` token may now be a per-model token.
- 640ae17: Add the `searchable_semantic_ai_never` refusal (`checkSemanticSearch`, full pass only): a `@Searchable({ semantic: true })`
  text field whose `@Classify` data class says `ai: never` is refused. The source reader now carries a data class's
  constant effects on its `@Classify` facet as `options.dataClass` (STA-1251).
- 7cbd46d: `stackra gen` writes `#stackra/settings` (`.stackra/gen/settings.ts`): `Settings = settingKeys({...})`, one typed key
  per setting field of each settings class (sections flattened), with its type, default, scopes, bounds, nullability,
  `@Setting` flags, section, earlier name and label key. New `emitSettings` export. A class extending
  `Settings.pick([...])` now compiles an `X$` over the picked keys of the member's own settings classes; a key gen cannot
  resolve is refused as `settings_key_unresolved`.
- 0f3325f: Read the shapes the OS gen pass refused and give apps their client modules and permission sets.
  
  - A field typed with a `@stackra/*` class, interface, alias or union whose package ships `<Type>$` reads as the new
    `shipped` shape kind, imported back from that package (STA-1290). The `X$` is also found in the barrels of a
    declared package the program never loaded, so a member importing only `@stackra/contracts` finds `ScopeRef$` in
    `@stackra/validation`.
  - A package config override (`class ScopeConfig extends BaseScopeConfig`) takes each field's type and rules from the
    base's `Config({ schema })` options class and reads `...this.<field>` as that class's default. `Object.freeze(...)`,
    a shared `const` with a constant initializer, and `I18n.<namespace>.<path>` read as constants.
  - `#stackra/clients/<service>` matches the producer's manifest member in snake or kebab case
    (`compliance-privacy` finds `compliance_privacy`).
  - The generated client also exports one `moduleRef` client module per producer module (`ReviewsModule`) and one
    `permissionsRef` set per Permissions class (`ReviewPermissions.moderate`). The manifest records each permission's
    `class`.
  - Gen writes a root `vitest.config.ts` shim that re-exports `.stackra/vitest.config.ts`, so `vitest run` loads the
    generated setup; an authored root file is refused (`shim_authored`), never overwritten.
  - Every generated file, not only clients and schemas, is refused when it imports a `@stackra/*` package the member
    does not declare (`generated_dependency_missing`).
- d7c5bf2: Read exported `defineSlot` and `fillSlot` calls, list them in the manifest (`slots`, `fills`) for the OS registry, and
  refuse a fill that breaks its slot's contract: `slot_undeclared`, `slot_surface_mismatch`, `slot_props_mismatch`,
  `slot_fill_duplicate`, `slot_key_duplicate` and `slot_options_not_constant` (ADR 0438).
- 8c52f12: The manifest lists `surfaces`: each surface a shell dependency's slots sit on, with the shell line the member targets
  there (`targets: "console@3"`, from the shell's major) and the shell package (`surfacesOf`). Two shells on one surface
  at different majors are refused on the full pass (`surface_targets_conflict`, `checkSurfaces`). New
  `ExtensionBundleManifest` type and the pure `modulepreloadOf(shellEntry, bundleBase, bundle)` for the edge Worker's
  modulepreload links (ADR 0436, stackra-04).
- 4f92d09: Emit the system graph (ADR 0452, stackra-59). Every full run writes `.stackra/graph.json` (`memberGraphOf`): modules,
  called services, integration events published and consumed, tables, packages and ports with their driver candidates.
  `writeRepoGraph` (`./node`) joins a repo's member graphs and its `stackra.flows.json` into `stackra.graph.json`, and
  `mergeSystemGraphs` merges the os, commerce and product repo graphs into one; both use `systemGraph`, which resolves
  call and event edges, derives `usedBy` and flow tags and lists the gaps.
- 1ab0f73: Gen reads `Translated`, `TranslatedStrings` and `Upload<Bucket>` shape fields (STA-1218): zod, JSON Schema and
  OpenAPI output, and `TranslatedType` in a model's EntitySchema.
- 2c05f14: Gen runs in two passes so services that consume each other's clients in a cycle can bootstrap (STA-1232). Pass 1
  writes every member's `stackra.manifest.json` without its clients (a consumed service in the same workspace is no
  longer a refusal there); pass 2 writes the clients and the rest against those manifests, in rounds until one writes
  nothing. A refused run still writes its clients and, when only workspace services stand in the way, its manifest.
  New: `stackra gen --manifests` (pass 1 alone), `generate(root, { pass: "manifests" })`, `generateMember(..., { pass })`,
  `emitClients(ir, { pending })` and `MemberIR.workspaceServices`.
- 396e384: Packages ship their `stackra.manifest.json` (listed in `files`), and the manifest gains a `config` section that gen
  reads for package config rows instead of the `*Config` name suffix. `stackra gen --check` refuses an unshipped manifest
  (`manifest_unshipped`). New memory drivers: `ConnectionStore` (integrations), `ScopeResolver` (scope),
  `RealtimeFanout` (realtime), `ErrorReporter` (errors), `SecretStore` (config) and `FlagProvider` (feature-flags).
  Generated file headers keep ` *` on continuation lines, so every generated header changes on the next regeneration.
- 0a20a9f: Outbox change feed (ADR 0078 and 0221, amended 2026-10-28). Row changes go to a retained, day-partitioned
  `outbox.changes` log (migration `outbox.0004_create_changes`) instead of being deleted on delivery; each change
  consumer reads it from its own cursor (`outbox.change_cursors`), with backoff and a stall that drops nothing.
  `RowChange` gains opt-in `before`/`after` values (the new `CapturesChanges({ values, exclude })` trait and
  `changeCaptureOf` in @stackra/model drop encrypted and `@Classified` fields). New: the `ChangeFeed` port with memory
  and Postgres drivers, `ChangeFeedService` (`replay`, `resume`, `backfill`), `ChangeFeed.maintain` (run daily by
  `data_maintenance.change_log.maintain`) and
  `outbox.changeRetentionDays`, `ChangeConsumer.consumeMany` with `coalesceChanges`, and the `@ConsumesChanges(Model)`
  facet, which gen turns into `registerChangeConsumers` rows. @stackra/database adds `NativeWriteWatcher` and
  `connectNativeWriteWatcher`, so `CrudService`'s native verbs report their rows to the feed.
- 0e7eb1f: Serve a query's `cache` option on the server (ADR 0305 rule 31 as amended, STA-1445). `@stackra/actions` adds the
  `cache` step to `PipelineStage` (inside the interceptors, before `handle`): with a `Cache` from `@stackra/cache` bound,
  a query that declares `cache: { ttl, per?, invalidateOn? }` answers from its entry or runs `handle` once and stores
  the answer. `CacheScope` (`Principal`, the default; `Scope`; `Site`) says whom one entry is shared with, and the key
  carries the tenant, that holder and a fingerprint of the input and the request facts. `registerCachedQueries` and
  `QueryCacheEvictorListener` forget a query's entries in the event's tenant after an `invalidateOn` event commits, and
  `expectScopeCacheSafe` (`./testing`) proves a scope-wide query answers every caller the same. `@stackra/actions` now
  depends on `@stackra/cache`.
  
  `@stackra/gen` refuses `site_cache_reads_caller` (a site-cached query that reads its caller), registers the cached
  queries with `registerCachedQueries`, binds the evictor in a service that declares `@stackra/cache`, and wires each
  live query's refresh (`liveQueryRoutes`) in the boot of a service that runs `@stackra/realtime`. `emitBoot` takes the
  manifest as a second argument.
- 3b19f6d: Rate limits as ADR 0217 decision 2 promises (STA-1477). `RateLimitedError` carries the refusing bucket's
  `retryAfterMs`, `limit` and `remaining`, and the new `rateLimitHeaders` turns them into `Retry-After` and
  `RateLimit-*`. The pipeline keys the area bucket by (app, scope), passes the bucket's numbers on the refusal and, with
  an outbox bound, writes one `actions.rate_limited` usage event per refusal. `EntitlementRateLimitBudgetDriver` sizes
  the area bucket from the plan's `rate_limit.<area>_per_minute` and `rate_limit.<area>_burst` value entitlements. The
  generated HTTP adapter answers a rate-limited refusal with 429, its envelope and the headers.
- a32b62d: Add `@stackra/reports`: the `Report<Source>({ key, dimensions, measures, defaultFilter, permission })` kind base with
  time-grained and relation-path dimensions and a closed set of measures (count, countDistinct, sum, avg, min, max and
  formulas over other measures), the `ReportRunner` port and the `ReportRequest`/`ReportResult` contract. Gen reads the
  `report` kind, records each report in the manifest's `reports` section (refusing unknown paths and misplaced files) and
  writes one query class per report into `#stackra/reports`.
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- f746759: Row-level security conformance (stackra-258). `@stackra/database/testing` adds `assertRowSecurity` (every table
  holding the owner column has forced row-level security and its `pol_<table>_<column>` policy, the service role does
  not bypass it, and a rolled-back two-owner probe sees and moves nothing) and `usePostgres({ migrationsDirectory })`.
  `@stackra/tenancy/testing` adds `tenantIsolationOptions()`. Gen refuses a service model that is neither owned nor
  `Model.global` (`model_tenancy_missing`), records `global` on manifest models, and writes
  `.stackra/tests/tenant-isolation.int.test.ts` for a service with owned models.
- 3649655: Search parent invalidation and a facet drift check (data-layer gaps se3, se4, se10). `registerSearchableModels` now
  also watches every model a dotted `@Searchable` path walks to (`variants.sku`) with the new `RelatedChangeService`,
  which finds the parent rows through the relation path and re-indexes them, so their documents no longer go stale.
  `SearchableChangeService` gains `consumeMany` (one `$in` load and one `index` call per run), and both consumers skip
  an update that writes no field the document reads. Gen refuses `searchable_columns_drift` when a model's
  `@Searchable` text or filters differ from the latest `t.searchable` literals of its table.
- c526bed: A service's generated server entry now hands `createApp` its `#stackra/boot`
  (`createApp(Root, { wiring, boot })`), and the server `createApp` awaits it once the container is ready with
  `DATABASE_URL` and a shutdown signal that `close()` aborts after the drain, so the bus, inbox and relay connect at
  service start and stop on shutdown. The generated `boot` connects nothing when the signal has already aborted, and
  disconnects the bus and inbox at once when it aborts mid-boot.
- fa41d2d: The manifest follows ADR 0360 decision 4: a query, or an action a user can perform, is an MCP tool by default, and
  `tool: false` on one needs a `// reason:` line (`tool_reason_missing`). Tool entries carry derived MCP `hints`;
  actions carry their `effects` tags (`effect_unknown`); Integrations carry `roles` and `listing`
  (`integration_role_unknown`); a `replaces` section lists every `@Replaces`. Exports `toolHints`, `EFFECT_TAGS`,
  `INTEGRATION_ROLES` and `ToolHints`.
- 5e8114b: Resource tables get the full filter and sort vocabulary (reporting gap 5, ADR 0307 rule 2). `@stackra/database`:
  `CrudService.table` reads each filter value as a `TableFilter` (a value, a list, or `{ op }` for `range`,
  `dateRange` with bounds or a named relative range resolved by the new `TableOptions.period`, `gt`/`gte`/`lt`/`lte`/`ne`,
  `contains` and `isNull`) and a multi-key sort (`TableSort[]`, three keys at most, the primary key last). Any other
  object filter value, which used to reach MikroORM as is, is now refused with `table_filter_invalid`
  (`TableFilterInvalidError`). `@stackra/panel`: `Filter.range`, `Filter.dateRange`, `Filter.compare` with the new
  `FilterComparison` enum, `Filter.contains`, `Filter.isNull` (and the same on the table builder's filter factory),
  `.thenSort(key, direction)` tiebreak keys on the default sort, and `tableInput` sends each drawn value in its wire form;
  the web list draws range, date-range and is-null filters with `@stackra/ui`'s number, date-range and boolean editors.
  `@stackra/gen`: the full pass refuses a recorded resource table that sorts or filters on a path no index leads with
  (`sort_not_indexed`, `filter_not_indexed`).
- 8a1be69: The remaining v3 field decorators of ADR 0294 R6: `@Lowercase` (a transform gen compiles to `.toLowerCase()`),
  `@Hidden` and `@Visible({ audience })` with `OutputAudience` (serializers) in `@stackra/validation`, and `@OneToOne`
  in `@stackra/model`. Gen leaves a `@Hidden` field out of the shape's `X$`, its `X$Check` and the manifest's JSON
  Schema, so it never goes out on the wire (stackra-260).
- d19a3d5: Wire the round-14 features (STA-1385). A service that declares `@stackra/app` gets `.stackra/encore/<member>/http.ts`
  (`emitEncoreHttp`): `answerHttp` answers an `OPTIONS` preflight with 204 and `corsHeaders(request, CorsConfig)` and
  adds those headers to every other answer. Its wiring binds `OriginGuard` and `CsrfGuard` with the `app.cors` and
  `app.csrf` config rows and the `HealthIndicator` driver of each declared package (database, cache, queue, realtime,
  filesystem, search) with its config row (`SERVER_CONTRIBUTIONS`). `AgentRuntime` is bound with `AiMeter` and
  `DiscoveryService`. An app's browser route table registers the declared manifests' `ui.resources` trees with
  `registerResources` and lists `resourceLabelKeys`.

### Patch Changes

- 854d7a9: Add `apiCacheControl` to `@stackra/app/server` (ADR 0325 rule 22): an API answer to a signed-in request (an
  `Authorization` header or any cookie) or an answer that sets a cookie is `private, no-store`, over the handler's own
  header. The generated HTTP adapter (`answerHttp`) applies it to every answer (STA-1448).
- ae3d280: Add the `@stackra/config/contracts` entry and move the `SecretStore` port into it (one symbol, one entry): import it from
  `@stackra/config/contracts`; `@stackra/config` no longer exports it. Dependants import from the new entry.
- cc8db5e: Move the integration events' wire-name registry, `registerEventNames` and `EVENT_NAMES`, from `@stackra/outbox` down
  to `@stackra/events` (STA-1387). `@stackra/outbox` re-exports both, so its writers, inbox and existing callers are
  unchanged. Gen's `.stackra/gen/registrations.ts` now imports `registerEventNames` from `@stackra/events`, so a package
  below the outbox (`@stackra/actions`, with `AuditEntryRecorded` and `UsageRecorded`) registers its integration events
  without declaring `@stackra/outbox`, which would close a package cycle; gen no longer refuses it with
  `generated_dependency_missing`.
- bbec10c: `readAppDefinition` refuses a `defineApp` argument that is not static data (a spread, a call) as
  `app_definition_not_static` again, instead of reading the parse error as the definition (STA-768).
- 9c799c4: gen writes its committed JSON (`stackra.manifest.json`, `openapi.json`, `.stackra/graph.json`, `stackra.graph.json`
  and the merged system graph) in oxfmt's shape through the new `formatJson`: arrays that fit in 100 columns sit on one
  line. `oxfmt --check` now passes on the committed manifests without a format step; regenerate them once with
  `stackra gen` to pick up the new layout. The content is unchanged.
- 957fe36: Golden snapshot tests (STA-1320): `__golden__/` holds fixture workspaces for a service, a package with drivers, an app
  with clients, a docs app, a consumer of another service's manifest, package lang and eight whole-run refusals;
  `src/node/__tests__/golden.test.ts` runs gen over them and diffs the written files and refusals against the committed
  expected output (`UPDATE_GOLDEN=1` refreshes it). Tests only; gen's behaviour is unchanged.
- cda22dd: A driver over another package's base imports its port from that package's entry (`@stackra/search/contracts`), not
  the base's own `#contracts/index` path, which the member cannot resolve.
- cac7c42: A package's own wiring no longer binds the `SERVER_CONTRIBUTIONS` classes it ships (`QueryCacheEvictorListener` in
  `@stackra/actions`), nor links the driver tables their tokens reach, so `@stackra/actions` stops importing
  `@stackra/storage` through the cache's storage candidate (`generated_dependency_missing`). A service that declares the
  contribution's package still binds it (STA-1445).
- d5b457f: A package's own wiring lists a declared package's driver candidate without its tokens when they come from a
  `@stackra/*` package it does not declare, as it already did for an undeclared library. `@stackra/data-transfer` stops
  importing `@stackra/database` through the outbox's `postgres` `ChangeFeed`, and `@stackra/database` stops importing
  `@stackra/storage` through the cache's `storage` driver (`generated_dependency_missing`). Its tests take the port's
  default driver; a service, app or worker keeps the tokens and must declare the package.
- 780b049: Gen a v2 service (an authored `src/main.ts`, until STA-344) without the v3 runtime entry, tool configs and Encore app
  file, so `stackra gen` no longer refuses services/example and services/health with `generated_dependency_missing`,
  `encore_app_missing` or `shim_authored`. A v3 service is checked as before.
- a78c614: The generated inbound webhook route (`.stackra/gen/webhooks.ts`) now passes the request's decoded query parameters to
  `WebhookReceiver.receive` as `InboundWebhook.query`, so query-signed schemes verify (Paymob `?hmac=`, Tamara
  `?tamaraToken=`; STA-1359).
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
- 8b38906: Packages ship `stackra.manifest.json` in their tarballs (STA-1362). `@stackra/brand-kit` lists it in `files`. The
  workspace `.pnpmfile.mjs` beforePacking hook refuses to pack a Stackra package (a `stackra` field of kind `package`,
  tier other than `config`) whose manifest is missing or left out of `files`; the manifest is written by
  `stackra gen --manifests` and committed, never generated at pack time. The gen README and AGENTS.md say so.
- 1b4effa: `@stackra/platform`'s permission port is named `SystemPermissions` (key `platform.SystemPermissions`), beside
  `SystemAccessibility` and `SystemSettings`, so it no longer shares a name with `@stackra/devices`' `DevicePermissions`.
  Its drivers are `MemorySystemPermissionsDriver` and `ExpoSystemPermissionsDriver`; the card terminal and scale drivers
  take it as their permission parameter, and gen's host wiring defaults its `SystemPermissions` table.
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
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [c56d7fe]
- Updated dependencies [2787c1e]
- Updated dependencies [5fe0327]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [e756399]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [d19a3d5]
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/money@0.1.0
  - @stackra/support@0.1.0

Written by Changesets on release; never edited by hand.
