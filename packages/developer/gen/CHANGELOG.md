# @stackra/gen

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
