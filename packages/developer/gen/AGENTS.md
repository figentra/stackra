# AGENTS — @stackra/gen

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/gen: where code goes, entries and barrels, the package rules (generated service
         clients and the manifest and clients passes included), the rules that fail the build and PII.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0294; ADR 0295; ADR 0305; ADR 0260 (generated clients and typed events); ADR 0263; ADR 0162 and ADR 0222
                    (the translated and upload shape kinds); ADR 0338 (a replica query's `ReplicaPage` output); STA-1290 (the shipped shape kind); STA-1293 (i18n, clients for apps, undeclared packages); STA-1296 (client modules and permission sets, config overrides, the root Vitest shim); STA-1298 (package lang namespaces in `I18n`, `i18n_key_missing`, `i18n_namespace_clash`); STA-1309 (catalogue loaders); STA-1306 (the quality-gate refusals); STA-1316 (the docs site); STA-1363 (consumed services' lang, remote shapes, `Settings.pick`); stackra-209 (`#stackra/settings`, `settings_key_unresolved`); STA-1322 (the Encore app file); STA-1251 (`searchable_semantic_ai_never`); data-layer gap se10 (`searchable_columns_drift`, stackra-273); ADR 0438 (shell slots and fills, stackra-03); ADR 0436 (surface targets, `modulepreloadOf`, stackra-04); ADR 0336 (model additions, stackra-64); ADR 0452 (the system graph, stackra-59); STA-1365 (gen agrees with the base-matches-suffix lint, `I18nKey`, members off the container); ADR 0159 (the migration target, stackra-248); ADR 0465 d5 (the encryption wiring and checks, stackra-262); ADR 0238 (the Encore database and the boot's url, replicas and timeouts, stackra-250).
-->

The Stackra compiler. Member at `packages/developer/gen` (`tier:lib`), in the programming model v3.1 shape (ADR 0294,
0305). Entries `.`, `./node`, `./testing` and the `./metro-transformer` tool hook (ADR 0127, 2026-10-24 note).

## Where code goes

| You are writing…                                    | It goes in…                                 |
| --------------------------------------------------- | ------------------------------------------- |
| A pure formula or emitter (IR in, text out)         | `src/core/functions/<name>.function.ts`     |
| A base class authors extend (`DocsConfig`)          | `src/core/bases/<name>.base.ts`             |
| Discovery, the host seam, file writing, Vite plugin | `src/node/functions/`                       |
| The manifest contract helpers                       | `src/testing/functions/`                    |
| Metro's transformer                                 | `src/metro-transformer/functions/`          |
| Constants and types                                 | `src/<entry>/{constants,types}/`            |
| A test                                              | `__tests__/<name>.<kind>.test.ts` beside it |
| A golden fixture (STA-1320)                         | `__golden__/<fixture>/` (see its AGENTS.md) |

## Entries and barrels

- `src/{core,node,testing,metro-transformer}/index.ts` are stand-in barrels until gen writes its own entry barrels
  (STA-339); add every new public file to its barrel.
- `.` is pure: no `node:*`, no `typescript` import. Source is read only in `./node`, behind the one host seam
  (`openHost`): TypeScript 7 first, `typescript6` as the fallback (ADR 0294 d26). Never ts-morph.

## This package

- The committed `stackra.manifest.json` is the IR; a dependency is described by its manifest, never its `.d.ts`.
- Output is deterministic: files sorted by path, stable key order. Every refusal has a snake_case code, a position and
  a fix; when there is one, nothing is written.
- Identity formulas live in one place each (ADR 0294 decision 20); other packages call them, never copy them.
- The case helpers (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`) are `@stackra/support`'s (stackra-224); gen
  imports them and never keeps a copy, so its word breaks are the ones every package uses.
- A generated registration calls only a function its package exports, with rows from the locked identities, and is
  written only when it has a row. A new public id prefix of a platform package is a reviewed row in
  `PUBLIC_ID_PREFIXES` (ADR 0135 rule 2). The member named after a prefix owner's module may host that model under its
  own key (manifest `hosts`, ADR 0294 amendment 2026-10-26).
- The constant evaluator threads a `this.<field>` resolver (`SelfOf`) through every recursion; never call `constant`
  point-free (`.map(constant)` would pass the index as the resolver).
- Clients (ADR 0260): `#stackra/clients/<service>` is written by `emitClients` from the producer's committed manifest
  (found beside the member by `readServiceManifests`, or in a dependency), never from its source. The source reader
  takes a parameter typed with a class from `CLIENTS_SPECIFIER` as a class token before the file exists; the wiring
  binds it over `ClientTransport`. Keep the one spelling in `CLIENTS_SPECIFIER`. Any own file (tests included) that
  imports from it also consumes the service (`SourceReader#clientImports`, `MemberIR.clientImports`), which is how an
  app gets its clients; an app reads the producer from the repo's `services/` too (STA-1293).
- Undeclared packages (STA-1293, STA-1296): `undeclaredPackages` refuses any generated file importing a `@stackra/*`
  package missing from `ir.packages` (clients and schemas first, then every other file as
  `generated_dependency_missing`); a schemas file is also held to `zod`. `schemaModules` writes no schemas file for a
  member with nothing to register (only enums, configs, or shapes whose `X$` the member ships), so an enum-only
  package needs no zod; the registrations and entry barrels read the same list. When a target starts importing a new platform package, expect members to need that
  dependency, and update the fixtures (`GENERATED_IMPORTS`, `writeFixtureMember`'s package.json) in the same change.
- Client modules and permissions (STA-1296): `emitClients` writes a `moduleRef` class per manifest module and a
  `permissionsRef` class per Permissions class (the manifest's permission `class`, else derived from the key). Service
  keys match in snake or kebab case (`readServiceManifests`).
- Config overrides (STA-1296): a package config's chain is extended with its `Config({ schema })` options class
  (`configChain`), so an override's field type and `this.<field>` default come from there. `Object.freeze(x)`, a
  shared `const` with a constant initializer, and `I18n.<ns>.<path>` from `#stackra/i18n` (`"<ns>::<path>"`) are
  constants. A shipped `X$` is also looked up in the barrels of declared packages the program never loaded.
- Root shims (ADR 0295 decision 5): `vitest.config.ts` at the member root re-exports `.stackra/vitest.config.ts`
  (`ROOT_VITEST_SHIM`), written only when no root config exists. `generate` keeps an authored one (no generated
  notice) that imports `./.stackra/vitest.config` and skips the shim; it refuses (`shim_authored`) any other (STA-1297).
- Driver candidates of declared packages (STA-1297). **Source: the package manifests**, never a hand-kept table and
  never the packages' source or `.d.ts`. `buildManifest` writes, for a package only, each driver entry's `classes`
  (`{ <name>: { class, from, deps? } }`: the class, its public entry from `packageSpecifier` (a file in another
  `src/<folder>`, such as `src/desktop`, is that folder's own entry, `./desktop`), its constructor tokens with `#…`
  subpaths mapped by `publicSpecifier`; an `abstract` driver is a base, never a candidate) and `config` (`{ class, from }`, the config class whose field
  selects one). `emitWiring` reads them (`dependencyDriverTables`) and lists a package's table only for a port its
  bindings reach (the `used` worklist: bindings, platform bindings and driver constructors, transitively), merged
  under the member's own candidates (own name wins). A package candidate with a token from a library the member does
  not declare (`PostgreSqlMikroORM` of the database's `postgres` driver) is listed without tokens, so a wiring never
  imports an undeclared library; such a driver is started by its package, never built by the container. In a
  package's own wiring so is one with a token from a `@stackra/*` package the package does not declare (the outbox's
  `postgres` `ChangeFeed` in `@stackra/data-transfer`, the cache's `storage` driver in `@stackra/database`): its tests
  take the port's default driver; a service, app or worker keeps the token and is refused until it declares the package.
  A package's own wiring is registered only by its own tests (the generated setup): there a port with several
  candidates gets `default`, its `memory` driver, else its one `./testing` driver, else its one
  `Driver(Port, { testDefault: true })` driver (ADR 0266), so the container boots; the container takes it ahead
  of the config field (whose value there is the production default, `postgres`); a service's or app's wiring never gets one. A `Driver(Port, { internal: true })` driver is never a candidate, in the manifest or any wiring. A package `*Config` class a reached token names gets a config
  row (key from `configKeyOf` and the package's member) unless the member overrides it. The `DriverRegistry`
  augmentation lists the member's own drivers only: packages augment their own ports. A package manifest written
  before this change has no `classes` and contributes nothing until the package is generated again. Test-only
  candidates (a `ClientFake` transport) are testing plugins, never manifest rows.
- Package config section (STA-1308). A package manifest lists its config classes under `config`
  (`[{ key, class, from }]`, own configs only, not overrides). `emitWiring` writes a package config row only for a
  token that a declared package's manifest lists there or names as a driver's selecting `config`; it never guesses
  from a `Config` name suffix. A package that is not declared, or whose manifest predates the section, brings no row.
- Shipped manifests (STA-1308, ADR 0158). Every `@stackra/*` package with a `stackra.config.ts` commits
  `stackra.manifest.json` and lists it in `files` in package.json. `stackra gen --check` reports a stale or missing
  manifest as stale, and for a package refuses `manifest_unshipped` when `files` is set and leaves it out. Gen never
  runs on a Mac (builder rule 6): the testing session regenerates and commits the manifests on ci-box. The
  manifest is generated by gen and committed, never at pack time; the root `.pnpmfile.mjs` beforePacking hook only
  refuses to pack a package (a `stackra` field of kind `package`, tier other than `config`) whose
  `stackra.manifest.json` is missing or left out of `files` (STA-1362), so `pnpm pack` and `pnpm publish` never ship a
  package a host's gen cannot read.
- i18n (STA-1293): `readCatalogues` reads `assets/lang/<locale>/*.json`; `emitI18n` writes `#stackra/i18n` (`I18n`
  through `keys()` of `@stackra/i18n`, `locales`) only when the member declares `@stackra/i18n`. A `@Field(zod)` hatch
  carries the named imports its source uses (`TypeDesc` hatch `imports`, a type-only one marked and imported as a
  type, so `z.custom<RouteKey>(...)` resolves in the generated file); a nullable field gets `.nullable()` once.
- Consumed services' lang (STA-1363): `readServiceCatalogues` reads the `assets/lang` of each service in
  `MemberIR.services` (the folder `readServiceManifests` matched) and appends it to `packageCatalogues` with `from`, its
  lang folder relative to the member root; `emitI18n` loads those files as `../../<from>/...`. Never resolve a service
  through node_modules (ADR 0010).
- Remote shapes and `Settings.pick` (STA-1363): `remoteShape` of `@stackra/clients` is in `KIND_BASES` (kind
  `schema`, `KindInfo.remote`). A shape that extends one, or derives from one with `PickType`/`OmitType`/`PartialType`,
  gets `ShapeIR.base` `{ kind: "remote", name, from, derive? }` and only its own fields; `emitSchemas` extends the
  client class's `schema` static. `Settings.pick(...)` imported from `#stackra/settings` is a schema kind read by its
  import (`KindInfo.settingsPick`). A default whose owner resolves but whose member does not is
  `shape_default_member_unresolved`.
- Settings (stackra-209): `emitSettings` writes `#stackra/settings` (`settingKeys` of `@stackra/settings`) from the
  `settings` shapes, their section shapes, the class `scopes` option and the `Setting` field facets; only a member that
  declares `@stackra/settings` gets it, and it imports nothing else (the label is cast through
  `SettingKeyInput["label"]`, so no `@stackra/i18n` import). The reader compiles a `Settings.pick([...])` class from
  the picked keys' `FieldIR`s of the member's own settings classes (`pickedSettings`); anything else is
  `settings_key_unresolved`. Keep the key metadata in step with `SettingKeyInput` of `@stackra/settings`.
- i18n packages (STA-1298): `readPackageCatalogues` reads the `assets/lang` of each declared Stackra package (a
  `@stackra/*` one, or a product package such as `@acme/loyalty-kit` that ships `stackra.manifest.json`) through `dependencyPath` (the node_modules walk `readDependencyManifests` uses); `i18nTree` merges their namespaces
  (the file name, e.g. `loyalty_kit`) beside the member's, each from its own base locale. `readI18nReferences` reads
  every `I18n.<ns>.<path>` chain of a file importing `#stackra/i18n` (tests included); `checkI18n` refuses a chain no
  merged catalogue ships (`i18n_key_missing`, reused by stackra-167) and a namespace two owners ship
  (`i18n_namespace_clash`).
- Catalogue loaders (STA-1309): `emitI18n` also writes `catalogues` (namespace to locale to
  `() => import("<file>.json", { with: { type: "json" } })`: the member's own as `../../assets/lang/...`, a package's
  through its `./assets/*` export, which every `@stackra/*` package shipping `assets/lang` exports) and
  `loadMessages(locale)`, which calls `loadMessages` of `@stackra/i18n` (fallback chain, farthest first). Only runtime
  `dependencies` bring lang (`MemberFacts.runtimeDependencies`); a devDependency's never reaches the runtime. A member
  may not extend a package's namespace (`i18n_namespace_clash` stays); default applied 2026-10-27, owner may override.
- Cycles between services (ADR 0260, STA-1232): a manifest never depends on a client. `generateMember(ir, previous,
{ pass: "manifests" })` returns the manifest alone and skips (`emitClients`'s `pending`) the consumed services in
  `ir.workspaceServices` (a folder beside the member); `{ pass: "clients" }` returns the client files alone. `generate`
  writes the clients of a refused run, rediscovers once, and still writes its manifest when the manifest pass is clean;
  every other output keeps "nothing written on error". Never make a manifest field depend on a consumed client.
- Events across services (ADR 0260 decision 4): a listener's `handle` parameter is read into `DeclaredClass.handle`
  (`event`, a `ClassRef`, or `relay` for `EventEnvelope` from `@stackra/outbox`). A `#stackra/clients/<service>` event
  makes that service consumed (discovery and `emitClients`) and must be one of its integration events
  (`client_event_unknown`); `emitRegistrations` writes `registerListeners`, the consumed events' wire names into
  `registerEventNames` (imported from @stackra/events, below @stackra/actions, so a package below the outbox needs no
  outbox dependency, STA-1387) and `registerRelays`. Never add a subscription by wire name.
- Change consumers (data-layer gap cdc2): a service's `@ConsumesChanges(Model)` or `([A, B])` facet carries the
  models as class values; `emitRegistrations` writes one `registerChangeConsumers` row per model and service. Never
  emit a pair for a facet whose argument is not a class value.
- Event wire names (STA-1255, default applied 2026-10-27 after os-100, owner may override): always
  `<module>.<name>.v<n>` from `eventName`. There is no member-level wire name and no service-key prefix; a `name` that
  starts with the module or member key is refused (`event_name_prefixed`, fix: drop the prefix). Never add an option
  that overrides the derived wire name.
- Event transport (ADR 0260 decision 4, ADR 0148): `emitEncoreEvents` writes a service's integration event topics
  (`events.ts`, registered by wire name) and, for a relay service only, `relay.ts`, which subscribes to every topic of
  the product from each publisher's generated `events.ts`. Discovery reads the publishers (`readPublisherManifests`)
  only for a member with a relay. A typed consumer (a listener of a `#stackra/clients/<service>` event) gets
  `subscriptions.ts`, one subscription per consumed event on the producer's topic (folder from `MemberIR.services`),
  into the inbox; a wire name its relay hears is left to the relay. Never make a producer list its subscribers. A
  local listener of the service's own integration event gets a subscription on its own topic (`./events`) into its
  inbox too (STA-1302): the broker publisher reaches only the topic, so without it the listener never runs.
- Server contributions (STA-1385): request guards and `HealthIndicator` drivers a service binds are rows of
  `SERVER_CONTRIBUTIONS` (package, class, constructor tokens, config rows), gated on the declared package; add a new
  one there, never a branch in `emitWiring`. Their config rows come after the packages' own rows, so a manifest's
  row or a host override wins. `emitEncoreHttp` writes the CORS adapter (`answerHttp`); headers come only from
  `corsHeaders` over the bound `CorsConfig` and `apiCacheControl` (ADR 0325 rule 22); with `@stackra/errors` declared
  it also answers a `RateLimitedError` as 429 with `rateLimitHeaders` (the one source of the rate-limit headers;
  STA-1477).
- Resource trees: the browser route table registers `ui.resources` from the declared manifests and lists the
  derived label keys (`resourceLabelKeys`, the panel's `resourceLabel` rule). Keep the two leaf rules equal.
- The shape vocabulary is `TypeDesc` (`src/core/types/type-desc.type.ts`). A new platform field type is one
  `TypeDesc` kind read in `readTypeReference` (only when declared in a `@stackra/*` package) and one case in each of
  `emitSchemas`, `jsonSchemaOf` and, for a model column, `emitEntities`, with tests. `Translated` and
  `TranslatedStrings` are `translated`; `Upload<Bucket>` is `upload` and its argument must be a Bucket class.
  Any other `@stackra/*` type whose `<Type>$` a `.` or `./contracts` barrel exports is `shipped` (STA-1290): imported
  as `Shipped<Type>$`, never compiled again; its JSON Schema is `x-stackra-schema`. Never add a hand-kept table of
  shipped schemas: the barrels are the source (`shippedSpecifier`). An `X$` the member ships itself (`SeoConfig$` beside
  `SeoOptions`) is never declared again in its schemas file nor exported from it: a second declaration shadows the
  import a field hatch uses and reads it before its initialization.
- `handle`'s output is a Schema class of the member, or `ReplicaPage` (any type argument) declared in a `@stackra/*`
  package for a replica query (ADR 0338): the reader records `handle.replica` and `buildManifest` writes
  `REPLICA_PAGE_SCHEMA` as `<module>.ReplicaPage`. Keep that constant in step with `ReplicaPage` in
  `@stackra/actions` and `REPLICA_CHANGES_SCHEMA` in `@stackra/query`.
- `generateMember` runs every emitter; `generate` (and so `stackra gen`) writes what it returns. A new output is an
  emitter in `src/core/functions/` called from `generateMember`, with its test.
- `emitBoot` is the only place a service's connect calls are written, in order after the container is ready: database,
  segments, `EventBus#connect` and `InboxService#connect` (disconnected when the shutdown signal aborts), then the
  relay. Without the bus and inbox connects, relays and typed subscribers receive nothing. A signal already aborted
  connects nothing. The server entry passes `boot` to `createApp` (`@stackra/app/server`), which aborts the signal on
  `close()`. The database url is the service's Encore `database` (`emitEncoreDatabase`, ADR 0238, stackra-250), never
  `DATABASE_URL`; the replicas are `DATABASE_REPLICA_URLS` (comma-separated); the timeouts and pool are the bound
  `DatabaseConfig`'s, with `DATABASE_POOL_MAX` over the pool's `max` (ADR 0473). `usesDatabase` is the one answer to whether a service has a database: the boot never connects
  one Encore does not declare.

- Platform services (ADR 0263): a `@stackra/*` service gen binds where injected is a `PLATFORM_BINDINGS` row
  (`MediaLibrary` included, STA-1297); a token
  may be a per-model token (`{ class: Revision, of: repositoryOf }`). A platform `CrudService<M>` also has a
  `PLATFORM_PARTNERS` row, so the host's registrations write its model partner (`RuleSetService` over `RuleSet`, the
  `@stackra/rules` node of ADR 0331). Keep both maps in step.
- `Projection` (ADR 0294 d16, ADR 0163 d1) is a binding kind declared in `@stackra/database`; gen binds it like a
  service. Its rows are that package's versions table, so gen writes no entity or migration for it.
- Reports (ADR 0470, stackra-389): `Report` is a `KIND_BASES` and `KIND_FILES` row (`report`, file `report`, suffix
  `Report`), not a binding kind (the runner takes the class). `reportsOf` is the one place that reads a report's
  options; `REPORT_VOCABULARY` copies the enums of `@stackra/reports`, so change both together. `emitReports` writes
  `#stackra/reports`. Keep the `base-matches-suffix` lint table of `@stackra/coding-standard` in step.
- Model additions (ADR 0336, stackra-64): `ModelAddition` is a `KIND_BASES` row (`model_addition`, a shape kind, file
  `model-addition`, suffix `Addition`); its partner is the base (the call's value argument, as `Driver(Port)`).
  `additionsOf` is the one place that matches the base in the dependencies' `models` and names the side table
  (`tableName` of the addition class). The base always comes from a released package, never from source. Keep the
  `base-matches-suffix` lint table of `@stackra/coding-standard` in step when it learns the suffix.
- `agent` and `pass` (STA-903) are binding kinds: a row in `BINDING_KINDS`, `KIND_FILES` and `KIND_BASES` each, and a
  written, locked `key`. An Agent with no constructor gets `AgentRuntime` (its deps are a `PLATFORM_BINDINGS` row).
- Entitlement keys come from `entitlementKey(module, class)` only, and must equal `@stackra/entitlements`'s runtime
  `entitlementKey`; the `entitlements` section's `gates` feed the `registerEntitlements` call of the registrations.
- The inbound webhook route (`emitWebhooks`) hands `WebhookReceiver.receive` the raw body untouched and the decoded
  query as `InboundWebhook.query` (Paymob `?hmac=`, Tamara `?tamaraToken=`); never parse the body before the receiver.

- Public API (OS ADR 0039 d2 and d3): only a manifest entry with `public: true` reaches `emitSdks`; never publish by
  `area`. SDKs come from the manifest, never from `openapi.json` (ADR 0158). A new language is one function in
  `emit-sdks.function.ts` with its test; package names and registries stay the release pipeline's.

## Docs site (STA-1316)

- A member with `src/config/docs.config.ts` is a docs app: `generate` returns `generateDocsSite` before discovery (no
  module graph, no manifest; the manifest pass writes nothing). Output goes to `.stackra/site/` only, never `src/`.
- `emitDocsSite` is pure; `generateDocsSite` imports the config (Node strips its types) and reads the fields of the
  one exported class. Keep `DOCS_OWNED_KEYS` in step with the keys `emitDocsSite` renders; anything else Mintlify
  takes goes through `raw`.
- `DocsConfig` lives here (`.` entry) because only gen reads it; no runtime package carries it.
- The asset check covers media extensions only, so a brand `NOTICE` under `src/assets/` is copied, never refused.

## Quality-gate refusals (STA-1306)

The gen refusals of the 2026-10-27 coverage audit, section 4. Each carries its fix; none is applied for you.

- `checkConventions` (core, full pass only, never the manifest pass): `kind_suffix_mismatch`, `kind_unregistered_base`
  (from `FileExports.classes`), `kind_class_name` (from `KIND_FILES`; a service may drop `Service`, a seeder may
  lead with its module key, `OrdersDemoSeeder`, names compare without case), `empty_module`, `sibling_not_exported` (an injected service only), `module_cycle`,
  `migration_numbering` (per `database/migrations/` folder, from 0001 without gaps), `event_name_shape` (an
  integration event's `name` is `<aggregate>.<verb>`) and `override_legacy_name` (under `src/overrides/`).
  Gen and the `base-matches-suffix` lint agree (STA-1365): the reader leaves out of `FileExports.classes` the classes the
  lint accepts with no kind base (`extends …Error` in `.error.ts`, a base-less `src/testing/` `.service.ts` class, a
  class under the lint's disable line with a `reason:`); a port-kind class in a `.driver.ts` of a
  `BELOW_CONTAINER_PACKAGES` member is no `kind_suffix_mismatch` and has no tokens. Keep both lists in step with the
  lint when either changes. An abstract class is never `event_base_abstract` and its constructor is never read; a
  class without one inherits its chain's nearest. `usesContainer` false (a member declaring packages without
  `@stackra/container`) means no wiring, no member module and a container-free setup.
- The query cache (STA-1445): `checkQueryCache` (core, full pass only) is `site_cache_reads_caller`, over the
  reader's `DeclaredClass.callerReads` (a text scan of the class body for the `handle` context's caller fields) and
  the input shape's caller id fields. `registerCachedQueries` rows come from the manifest's query entries with
  `cache.invalidateOn`; the evictor binding is a `SERVER_CONTRIBUTIONS` row; the live queries' refresh is written into
  `emitBoot` (which now takes the manifest) and resolves each wire name through `EVENT_NAMES`, so a name the
  registrations never registered fails at boot, never silently.
- `checkModelScope` (core, full pass only, stackra-258): `model_tenancy_missing` for a service running
  `@stackra/tenancy` only (packages' platform tables are not checked). `emitIsolationTest` writes
  `.stackra/tests/tenant-isolation.int.test.ts`; the integration task must include `.stackra/tests/**` to run it.
- `checkEncryptedFields` (core, full pass only, stackra-262): `encrypted_field_unknown`, `encrypted_field_unclassified`
  (the reader puts the `@Classified` code on `FieldIR.classified`) and `encrypted_native_write` over
  `MemberIR.nativeWrites` (`readNativeWrites`, a same-line text scan). `emitBoot` adds the `EncryptedFieldsSubscriber`
  over the bound `FieldCipher` when any model, own or a declared package's, has `HasEncryptedFields`. The
  `PersonalData` erasure methods are not compared: gen does not read them (stackra-314).
- `checkSemanticSearch` (core, full pass only, STA-1251): `searchable_semantic_ai_never`, a `semantic: true`
  `@Searchable` text path that ends at a field whose `@Classify` facet's `options.dataClass.ai` is `never`. The reader
  fills `options.dataClass` from the `DataClass({...})` from `@stackra/*` the class's chain extends (`dataClassOf`).
  A package model's field is not followed.
- `checkSearchableDrift` (core, full pass only, data-layer gap se10): `searchable_columns_drift`, an own model's
  `@Searchable` text (in order) or filters (as a set) differing from the latest `t.searchable` literals of its table
  (`MemberIR.searchableColumns`, `readSearchableColumns`, a text scan of the member's own migrations; paths compared in
  snake case). A table with no literals is not judged.
- The reader: `kind_base_name_reserved` (a model named after a `KIND_BASES` name), `secret_name_missing` (`@Secret`
  without a SCREAMING_SNAKE literal) and `partner_mismatch` for `Resource`, `Factory`, `StateMachine` and `Facts`
  (same-stem subject; `CrudService` keeps its own subject, as many services name a domain word).
- `checkI18n`: `i18n_key_missing` also for a derived enum label `<module>::enums.<enum>.<code>` missing from a
  base-language locale that ships the module's namespace.
- `generate`: `shim_authored` for an authored root `tsdown.config.ts` too (one that imports
  `./.stackra/tsdown.config` is kept), and `tool_reason_missing` for a root `*.extend.ts` outside the closed set
  (vite, expo, metro, desktop, pwa) or without a `Reason:` header. Owned-key changes in a hatch are not checked: gen
  does not apply hatches yet. Keep `KIND_FILES` in step with `KIND_BASES` and the coding-standard lint table.
- `encoreApp` (STA-1322): a service's full run writes `.stackra/encore/encore.app` from the root runway's
  `providers.encore.app`, refused as `encore_app_missing` without it (never a default id); an `encore.app` at the member
  or repository root is `encore_app_stray`. The root runway is read by a block-YAML lookup because gen does not depend
  on `@stackra/runway`; move to `readRunway` once it does.
- `compileMigrations` (stackra-248, ADR 0159): a service's full run imports each migration file (Node 24 strips the
  types) and compiles it with the member's own `@stackra/database` `compileMigration`, so the classes and the compiler
  share one kind registry. Own migrations are `src/modules/<key>/database/migrations/`; a declared package's are its
  `src/node/database/migrations/` (found by path, never re-exported); macros are the member's `database/macros/` files
  and every `Macro` a declared package exports from `./node`. Ordering (`orderMigrations`) and file layout
  (`emitMigrations`) are pure and keep the layout `readMigrationFiles` reads. A package installed from the registry
  (under node_modules, not a workspace link) does not load, since Node refuses type stripping there.
- `checkAppendOnly` (stackra-256): an own `AppendOnly` model whose module has migrations must have a compiled
  `revoke update on "<schema>"."<table>"` (`t.appendOnly()`), else `append_only_not_revoked`. Packages' models are
  their own gen's. The boot adds `AppendOnlySubscriber` with the database.

## Shell slots and fills (ADR 0438, stackra-03)

- A shell package declares `export const X = defineSlot<Props>({ key, surface, cardinality? })`; a product UI package
  fills it with `export const Y = fillSlot(X, Component, { surface })`, both from `@stackra/panel`. The reader takes
  only exported consts whose callee is imported from `@stackra/panel`; options are static (`slot_options_not_constant`).
- The props record is read from the `props` type of the `Slot<P>` value (prop name, `?` when optional, to the
  checker's type text, sorted). A fill's props come from the slot type it was compiled against, so a product built
  against an older shell differs from the shell's committed manifest (`slot_props_mismatch`).
- `slotOf` resolves a fill's slot from the member's own slots or a dependency's committed manifest (`slots`), never
  from the dependency's source. `checkSlotFills` (full pass only) refuses `slot_undeclared`, `slot_surface_mismatch`,
  `slot_props_mismatch`, `slot_fill_duplicate` (two fills of a `one` slot in a member) and `slot_key_duplicate`.
- The manifest lists `slots` (key, const, entry, surface, cardinality, props) and the resolved `fills` (slot key,
  const, entry, surface, props) for the OS registry. Not yet: a registration file for fills, and a break in
  `compareManifests` when a slot is removed or its props change (a follow-up batch).

## Surface targets and extension bundles (ADR 0436, stackra-04)

- `surfacesOf` derives the manifest's `surfaces` (surface, `targets: "<surface>@<major>"`, shell package) from the
  dependencies' committed manifests that declare `slots`; never authored, never read from source. The member's own
  slots make it a shell, so they add no target.
- `checkSurfaces` (full pass only) refuses `surface_targets_conflict`. Whether the edge serves a line is the registry's
  check at publish (Runway, stackra-13), not gen's.
- `ExtensionBundleManifest` is the shape `@stackra/vite-plugin` writes as `bundle.manifest.json`; `modulepreloadOf`
  stays pure and isomorphic so the OS Worker can call it. Gen never builds a bundle: that is the Vite preset's.

## The system graph (ADR 0452, stackra-59)

- `memberGraphOf(ir, manifest)` is the one place a member's graph part is derived; `generateMember` writes it last, as
  `.stackra/graph.json`, on the full pass only. Read it from the IR and the built manifest, never from source again,
  and keep every list sorted.
- Calls are the `#stackra/clients/<service>` services (injected or imported); consumed events resolve their wire name
  from the producer's manifest as the events target does. A new kind of edge is a field on `MemberGraph`, a case in
  `systemGraph`, and tests.
- `systemGraph` is the only derivation of a repo graph and of the merged graph: `writeRepoGraph` and
  `mergeSystemGraphs` (`./node`) only read and write files. A repo graph and the merged graph have one shape, so a
  merge of merged graphs is the same step. `usedBy` and `flows` are always derived again.
- Flows are declared once per repo in `stackra.flows.json` (configuration). Anything that does not resolve is a gap,
  never a refusal; never make a missing node in another repo fail a run.
- Not here: the CLI command (`@stackra/cli`) and the docs renderer (stackra-60).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Committed JSON goes through `formatJson` (oxfmt's shape), never `JSON.stringify(value, null, 2)`; a golden JSON file
  is re-checked with `oxfmt --stdin-filepath=x.json` (stackra-247).

## PII

None. Gen reads source code and writes generated code and manifests; it handles no personal data.
