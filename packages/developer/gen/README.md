# @stackra/gen

<!--
Stackra file contract:
Purpose: the package's reader guide: what gen is, its entries and symbols, a run, what one run writes (the generated
         service clients included, and the two passes that break a cycle between services) and what is not here.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0294; ADR 0295; ADR 0260 (generated clients); ADR 0261; ADR 0263; ADR 0162 and ADR 0222
                    (the translated and upload shape kinds); ADR 0338 (a replica query's `ReplicaPage` output); STA-1290 (the
                    shipped shape kind); STA-1293 (the i18n target, clients for apps, undeclared packages refused); STA-1296
                    (client modules and permission sets, config overrides, the root Vitest shim); STA-1298 (package lang
                    namespaces merged into `I18n`, missing keys and namespace clashes refused); STA-1251
                    (`searchable_semantic_ai_never`); ADR 0438 (shell slots and
                    fills, stackra-03); ADR 0436 (surface targets and the extension bundle's modulepreload list,
                    stackra-04); ADR 0336 (model additions, stackra-64); ADR 0452 (the system graph, stackra-59);
                    STA-1363 (consumed services' lang, forms over remote shapes, `Settings.pick`, unresolved enum
                    cases); stackra-209 (the `#stackra/settings` keys and `Settings.pick` forms); STA-1365 (gen agrees with the
                    base-matches-suffix lint, `I18nKey`, members off the container).
-->

The Stackra compiler. Gen reads a member's source through the TypeScript compiler API, derives every identity and
locks it in the committed `stackra.manifest.json`, compiles shape classes to zod, writes the container wiring, the
member module and the entries, and compiles class components to function components.

**Tier:** `tier:lib` (`packages/developer/gen`). Entries `.`, `./node`, `./testing` and the `./metro-transformer` tool
hook (ADR 0127, 2026-10-24 note). Depends on `@stackra/contracts`, `@stackra/errors`, `@stackra/money`, `@stackra/support`
(case helpers), `typescript`
7.0.2 (with 6.0.3 as `typescript6`, the fallback host) and `@babel/core`. It folds the old `ir` and `source` packages:
the committed manifest is the IR, and source is read behind one host seam, never through ts-morph.

## What is here

| Entry                 | Symbol                                                                       | Use                                                                                               |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `.`                   | `generateMember`                                                             | every file of a member from its IR, or none on an error                                           |
| `.`                   | `buildManifest`, `checkIdentityLock`, `compareManifests`                     | identities, the `@Renamed` lock, backward compatibility                                           |
| `.`                   | `emitSchemas`, `jsonSchemaOf`                                                | the shape compiler (`#stackra/schemas/<module>`)                                                  |
| `.`                   | `emitWiring`, `emitMemberModule`, `emitPackageEntries`, `emitRuntimeEntries` | `#stackra/wiring`, `#stackra/module`, `.stackra/entry/*`                                          |
| `.`                   | `emitEntities`                                                               | `#stackra/entities/<module>`: `[OptionalProps]`, `EntitySchema`, `registerEntities`               |
| `.`                   | `emitRegistrations`, `emitBoot`, `emitWebhooks`                              | a service's `#stackra/registrations`, `#stackra/boot`, `#stackra/webhooks`                        |
| `.`                   | `emitRoutes`, `emitBlocks`                                                   | an app's `#stackra/routes/<runtime>`, `#stackra/blocks/<runtime>`                                 |
| `.`                   | `emitPrefixes`, `PUBLIC_ID_PREFIXES`                                         | `#stackra/prefixes`; the shared prefix registry (ADR 0135)                                        |
| `.`                   | `emitClients`, `CLIENTS_SPECIFIER`                                           | `#stackra/clients/<service>`: one injectable client per consumed service (ADR 0260)               |
| `.`                   | `emitToolConfigs`                                                            | `.stackra/{tsdown,vitest}.config.ts`, `.stackra/vitest.setup.ts`                                  |
| `.`                   | `emitExpoConfig`                                                             | an app's `.stackra/app.config.ts` and the root `app.config.ts` shim (see "The Expo config")       |
| `.`                   | `emitI18n`                                                                   | `#stackra/i18n`: `I18n` (typed keys of `assets/lang`), `locales`, `catalogues` and `loadMessages` |
| `.`                   | `emitSettings`                                                               | `#stackra/settings`: `Settings`, the typed setting keys of the member's settings classes          |
| `.`                   | `reportsOf`, `emitReports`                                                   | the manifest's `reports` section and `#stackra/reports`: one query per `Report` (ADR 0470)        |
| `.`                   | `DocsConfig`, `emitDocsSite`, `DOCS_CONFIG_FILE`, `DOCS_SITE_DIR`            | a docs app's typed site config and the Mintlify site gen assembles (see below)                    |
| `.`                   | `openApiOf`                                                                  | `openapi.json`, the projection of the manifest                                                    |
| `.`                   | `actionKey`, `eventName`, `permissionKey`, `modelKey`, `tableName`, ...      | the identity formulas of ADR 0294 decision 20                                                     |
| `.`                   | `integrationKey`, `webhookPath`, `sequenceKey`, `blockKey`, `routeKey`       | integration, webhook, sequence, block and route identities                                        |
| `.`                   | `toolHints`, `EFFECT_TAGS`, `INTEGRATION_ROLES`                              | derived MCP hints, the effect tags and the Integration roles the manifest accepts                 |
| `./node`              | `generate`                                                                   | one run: write, or `{ check: true }` for `--check`                                                |
| `./node`              | `generateDocsSite`, `watchDocsSite`                                          | a docs app's run (`generate` takes it), and its watch for `stackra dev`                           |
| `./node`              | `discoverMember`, `openHost`                                                 | discovery on TypeScript 7, falling back to TypeScript 6                                           |
| `./node`              | `readServiceManifests`                                                       | the committed manifests of the services a member injects a client of                              |
| `./node`              | `classComponents`                                                            | the Vite plugin of the class-component pass                                                       |
| `./node`              | `compileClassComponents`, `classComponentsPlugin`                            | the pass for tsdown and other Babel hosts                                                         |
| `./metro-transformer` | `transform`, `getCacheKey`                                                   | Metro's `babelTransformerPath`                                                                    |
| `./testing`           | `loadManifest`, `previousRelease`, `expectBackwardCompatible`                | the manifest contract test                                                                        |
| `./testing`           | `loadOpenApi`, `projectOpenApi`                                              | `openapi.json` is the manifest's projection                                                       |
| `./testing`           | `discoverWithGen`                                                            | the Explorer conformance test                                                                     |

## A run

```ts
import { generate } from "@stackra/gen/node";

const { errors, changed } = await generate("services/commerce", { check: true });
```

Gen sorts files by path, reads each class's kind from its `extends` clause (`extends Schema`, `Action({ key })`,
`Model.with(...)`, `Page.of(X)`, `Driver(Port)`, or a class of the member), its options as constants, its partner from
the heritage type argument (`Policy<Order>`, `Extension<Point["slot"]>`), and its constructor parameter types as
tokens. A dependency is described by its committed manifest, never by its `.d.ts`; a package lists
`stackra.manifest.json` in `files` so a host reads it under `node_modules`, and `--check` refuses
`manifest_unshipped` when it does not (STA-1308). The manifest is committed, never generated at pack time: the
workspace `.pnpmfile.mjs` refuses to pack a Stackra package whose `stackra.manifest.json` is missing (STA-1362), so run
`stackra gen --manifests` and commit it first. Every JSON file gen commits (`stackra.manifest.json`, `openapi.json`,
the graphs) is written in oxfmt's shape by `formatJson` (short arrays on one line within 100 columns, objects broken),
so `oxfmt --check` passes on it without a format step (stackra-247). Every refusal carries a
snake_case code, a position and the fix; when there is one, nothing is written.

The quality-gate refusals (STA-1306) hold the conventions gen can see: a kind class's file suffix and name
(`kind_suffix_mismatch`, `kind_unregistered_base`, `kind_class_name`, `kind_base_name_reserved`), module files and
edges (`empty_module`, `sibling_not_exported`, `module_cycle`), `migration_numbering`, `override_legacy_name`,
`event_name_shape`, `secret_name_missing`, `partner_mismatch` for every same-stem kind, derived enum labels
(`i18n_key_missing`), an authored `tsdown.config.ts` (`shim_authored`) and unknown or unexplained `*.extend.ts` hatches
(`tool_reason_missing`). The whole-member ones (`checkConventions`) refuse the full run only, so `stackra gen --manifests`
still writes the manifest; the reader's (`kind_base_name_reserved`, `secret_name_missing`, `partner_mismatch`) refuse
both.

`@Lowercase` compiles to `.toLowerCase()` after `.trim()`; a `@Hidden` field is left out of `X$`, `X$Check` (omitted
like a relation) and the manifest's JSON Schema, so it never reaches an action output, OpenAPI or a tool schema
(stackra-260). `@Visible({ audience })` is read by no target yet.

`model_tenancy_missing` (`checkModelScope`, full pass only, stackra-258): in a service that declares
`@stackra/tenancy`, a model with neither `BelongsToTenant`/`BelongsToTenantOrPlatform` nor a `Model.global(...)` base is
refused (a model extending an own model takes its base's answer). The reader reads the traits of `Model.global(...)`
and marks the class `global`, which the manifest's model records. Such a service with an owned model and
`@stackra/testing` also gets `.stackra/tests/tenant-isolation.int.test.ts` (`emitIsolationTest`): its compiled
migrations, then `assertRowSecurity(postgres.database, tenantIsolationOptions())`.

The query cache (ADR 0305 rule 31, STA-1445): `site_cache_reads_caller` (`checkQueryCache`, full pass only) refuses a
query cached `per: CacheScope.Site` whose `handle` reads its caller from its context (`ctx.actor`, `scopeId`, `scope`,
`authorize`, `deviceId`, `assurance`, `client`, or a destructuring of them; the reader records them as
`DeclaredClass.callerReads`) or whose input has a caller id field (`actorId`, `userId`, `principalId`, `customerId`,
`scopeId`, `tenantId`). The registrations call `registerCachedQueries` from `@stackra/actions` with every query (own
or hosted) whose `cache.invalidateOn` names events, and a service that declares `@stackra/cache` binds
`QueryCacheEvictorListener` (a `SERVER_CONTRIBUTIONS` row; `@stackra/actions`' own wiring never binds it, nor links
the cache drivers its tokens reach), so an invalidating event forgets the cached answers after commit. A service that runs `@stackra/realtime` and the bus also gets each live query's refresh in its boot: one
`liveQueryRoutes` call per query with `cache.invalidateOn` (its permission, the principal's audience for
`per: principal` and the scope's otherwise), each route subscribed on the bus for its registered event class and sent
through `RealtimeRelay` when bound, else `RealtimeBroadcaster`.

A service with a `reads: "replica"` query (STA-1504), its own or one a hosted package's manifest records (`buildManifest`
writes a query's `reads`), reaches the `ReplicaReads` port (`replicaReadsPorts`), which the
pipeline resolves optionally, so its wiring writes the port's table from the declared packages' manifests:
`@stackra/database`'s `DatabaseReplicaReadsDriver` (`database`) with the `DatabaseConfig` row (`readYourWrites`).

The model encryption path (`checkEncryptedFields`, full pass only, stackra-262): `encrypted_field_unknown` (a
`HasEncryptedFields` field the model does not declare), `encrypted_field_unclassified` (an encrypted field without
`@Classified`), and `encrypted_native_write` (a `nativeInsert`, `nativeUpdate`, `insert`, `insertMany`, query-builder
insert or update, or raw `insert into`/`update` statement on an encrypted model, own or a declared package's, found by
`readNativeWrites` outside `__tests__` and `database/`). A service with an encrypted model gets
`new EncryptedFieldsSubscriber(container.get(FieldCipher), undefined, <the bound KeyProvider>)` among its boot
subscribers, so a cipher must be bound, and a key provider too for a `lookup` field. `checkBlindIndexes` (full pass
only, STA-1482) refuses a `lookup` field the trait does not encrypt (`encrypted_lookup_unknown`), `lookup` with
`subject` (`encrypted_lookup_subject`), a model without the `<field>Bidx: string | null` property
(`encrypted_lookup_undeclared`) and one whose `@Index` does not lead with it (`encrypted_lookup_not_indexed`).

`searchable_semantic_ai_never` (`checkSemanticSearch`, full pass only, STA-1251) refuses a model whose
`@Searchable({ semantic: true })` lists a text field (its own, an own base model's, or a dotted path through a relation
to an own model) whose `@Classify` data class says `ai: never`: semantic search embeds the text through a model
provider, which ADR 0380 forbids for that class. The reader puts the data class's constant effects on the `@Classify`
facet (`options.dataClass`). `SearchableOptions` in `@stackra/model` has no `semantic` field yet, so the check refuses
nothing until it does.

`searchable_columns_drift` (`checkSearchableDrift`, full pass only, data-layer gap se10) refuses a model whose
`@Searchable` text fields (in order: position is their weight) or filters (in any order) differ from the latest
`t.searchable({ text, filters })` literals of its table in the member's own migrations (`readSearchableColumns`, a text
scan; `memberId` and `member_id` agree). The fix is a migration with the facet's fields, then
`stackra search:reindex <Model>`. A table no migration gives search columns is not judged.

Shell slots (ADR 0438, stackra-03): a shell package declares `export const X = defineSlot<Props>({ key, surface })`
and a product UI package fills it with `export const Y = fillSlot(X, Component, { surface })` (both `@stackra/panel`).
Gen lists `slots` and `fills` in the manifest for the OS registry and refuses, on the full run, a fill whose slot no
manifest declares (`slot_undeclared`), on another surface (`slot_surface_mismatch`), built against other props than
the shell's committed manifest (`slot_props_mismatch`), a second fill of a `one` slot (`slot_fill_duplicate`) and two
own slots with one key (`slot_key_duplicate`); non-static options are `slot_options_not_constant`.

Surface targets (ADR 0436, stackra-04): a dependency whose committed manifest declares slots is the shell of the
surfaces those slots sit on, and its major is the line the member targets there. Gen writes `surfaces` to the
manifest (`[{ surface: "console", targets: "console@3", shell: "@os/console-shell" }]`; `surfacesOf`), which the
extension-bundle build of `@stackra/vite-plugin` copies into `bundle.manifest.json` and the registry checks against the
lines the edge serves. Two shell dependencies on one surface at different majors are refused on the full run
(`surface_targets_conflict`, `checkSurfaces`). `modulepreloadOf(shellEntry, bundleBase, bundleManifest)` is the pure,
isomorphic list of URLs the edge Worker preloads: the shell's entry, then the bundle's entry and static chunks; its
input type is `ExtensionBundleManifest`.

An event's wire name is always `<module>.<name>.v<n>` (`orders.order.paid.v1`): there is no member-level or
service-key-prefixed wire name, and a `name` that starts with the module or member key is refused
(`event_name_prefixed`, STA-1255).

## The docs site (STA-1316)

A docs app is a member with `src/config/docs.config.ts`, which exports one `DocsConfig` subclass. Its authored source
is `src/docs/` (pages), `src/assets/`, `src/snippets/` and `src/config/`; `README.md`, `AGENTS.md`, `package.json`
and `stackra.config.ts` sit at the member root. `generate` assembles the Mintlify root into `.stackra/site/`
(gitignored): `docs.json` rendered from the config, the pages at the site root (`src/docs/guides/x.mdx` serves
`/guides/x`), the assets and snippets, `api-reference/<service>/openapi.json` for each `apiReference` service and
`llms.txt`. A navigation entry is a page path, a nested group or `{ folder }` (every page in that folder, `index`
first). Refusals: `docs_source_misplaced` (a `docs.json`, `README.md` or stray file under `src/`),
`docs_page_outside`, `docs_page_missing`, `docs_page_unlisted`, `docs_asset_missing`, `docs_asset_unreferenced`
(media only), `docs_owned_key`, `docs_service_unknown` and `docs_config_invalid`. `stackra dev` keeps gen watching
`src/` under `mint dev`; `stackra build` runs `mint validate` and `stackra lint` runs `mint broken-links` and
`mint a11y`, all in `.stackra/site/` (ADR 0002 amendment of 2026-10-27).

## Tools, effects, listings and replacements

- **Tools by default (ADR 0360 decision 4).** A query, or an action whose `actors` include `user`, gets a `tool`
  entry (`name`, `default`, and the `hints` of ADR 0099 decision 3). `tool: false` on such a class needs a reason on
  the line above, `// reason: <why an agent may not call it>`, or trailing on the same line
  (`tool: false, // reason: …`); without one gen refuses with `tool_reason_missing`, and with one the entry records it
  as `toolOff`.
- **Query permissions.** A query takes `<module>.<model>.read`, unless its Permissions class declares the verb of its
  key (`audit_record.search` with `static readonly search`): then it takes that one. A `permission` option wins.
- **Effect tags (ADR 0099 decision 2, ADR 0360 decision 10).** `effects: [...]` is copied into the entry and feeds the
  hints; a tag outside `EFFECT_TAGS` is `effect_unknown`.
- **Listings (ADR 0355 decision 1, ADR 0308 rule 21).** An Integration's `roles` (plus `webhooks` when it receives
  them) and its `listing` (the entitlement reference) land on its entry; a role outside `INTEGRATION_ROLES` is
  `integration_role_unknown`.
- **Replacements.** Every `@Replaces(Base)` is listed in a `replaces` section.
- **Agents and passes (STA-903, ADR 0399, ADR 0348 decision 5).** `agent` and `pass` are binding kinds. An
  `Agent({ key, task, tools })` lands in `agents` (tools as action keys) and a `Pass({ key })` in `passes`; both keys
  are written and locked, a missing one is `identity_missing`. An Agent with no constructor is bound with
  `AgentRuntime`, the way an Integration gets `IntegrationRuntime`.
- **Entitlements (STA-903, ADR 0215).** Each entitlement lands in `entitlements` with its derived key
  (`<module>.<snake name without Entitlement>`), kind, counted model, `where` filter and `gates`: a limit gates its
  counted model's `create` actions, and an action or query naming it in an `entitlement` option is gated by it. The
  registrations file calls `registerEntitlements` with one row per entitlement, so `PlanSnapshotEntitlementSource`
  resolves every registered class. A class thunk option (`counts: () => Till`) is read as its class.

## Reports (ADR 0470, stackra-389)

`Report<Source>({ key, dimensions, measures })` of `@stackra/reports` is the `report` kind (file
`reports/<name>.report.ts`, class `<Name>Report`). `reportsOf` lists each one under the manifest's `reports`: key
`<module>.<key>`, the source model's key, the dimensions, measures and default filter as written, the permission key
and the generated query key `<module>.report.<key>@1`. It refuses `report_misplaced`, `report_vocabulary_invalid` (a
grain, measure kind or metric outside ADR 0470's closed set, `REPORT_VOCABULARY`), and `report_dimension_unknown` /
`report_measure_unknown` (a path whose segment an own source model does not declare, followed through its own
relations). `emitReports` writes `.stackra/gen/reports.ts` (`#stackra/reports`): `<Name>ReportQuery extends Query({
key: "report.<key>", permission })`, whose `handle` calls the injected `ReportRunner`. `emitSearchQueries` writes `.stackra/gen/search.ts`
(`#stackra/search`): `Search<Model>Query extends SearchQuery(<Model>)` per own `@Searchable` model (key `<model>.search`).
Both generated kinds are declared beside the authored queries (`reportQueriesOf`, `searchQueriesOf`), so
`generateMember` gives each its manifest entry, derived endpoint, MCP tool and wiring binding like an authored query
(STA-1459); its input and output are the package shapes (`SearchQueryInput`/`SearchQueryOutput`,
`ReportRequest`/`ReportResult`), written under the module's `schemas` from `GENERATED_QUERY_SCHEMAS`, and it gets
no `X$` in `#stackra/schemas`. The runner's driver is stackra-390.

## Model additions (ADR 0336)

An edition's `ModelAddition(Base)` class in `models/<base>.model-addition.ts` (`ProductAddition`) is the
`model_addition` kind; its fields are a shape (`ProductAddition$`). `additionsOf` lists each in the manifest's
`additions` section: key, class, file, the base model key read from the base's released manifest, the package it comes
from, the side table `<module>.<addition>s` (`fashion.product_additions`), the wire key (the module key) and the field
names. The module's entity file writes a side-table `EntitySchema` per addition, keyed by the base record's `id`.
Refusals: `addition_base_source` (base imported from source), `addition_target_missing` (no released manifest declares
the base) and `addition_key_collision` (two additions on one base under one wire key, another edition's included).

Not built yet: the side table's migration (the edition writes it: the base id as primary key, `t.belongsToTenant()`,
`after:` the base's), nesting the fields on the base's queries and actions, the layer 2b panel placements and the
field-level `@Renamed` check against the base version.

## The system graph (ADR 0452)

Every full run also writes `.stackra/graph.json`, the member's part of the system map (`memberGraphOf`): its modules,
the services it calls through a generated client, the integration events it publishes and the ones its listeners
consume (wire names from the producer's committed manifest), its model tables, the packages it builds on and its ports
with their driver candidates. Nothing is authored; it comes from the IR and the manifest.

Two steps in `./node` turn those into the map. `writeRepoGraph(root, repo)` finds every member graph under a repo,
stamps each node `<repo>.<member>` with its folder, reads the flows the repo declares once in `stackra.flows.json`
(`{ "flows": [{ "id", "title", "summary"?, "steps": [{ "from", "to", "kind", "label", "event"?, "data"? }] }] }`, a
step naming node ids, `actor.<key>` or `provider.<key>`) and writes `stackra.graph.json` at the root.
`mergeSystemGraphs(paths, out)` merges the os, commerce, product and stackra repo graphs into one. Both go through
`systemGraph`, which resolves calls (same repo first) and events into `edges`, derives each node's `usedBy` and flow
tags (`flows`), and lists in `gaps` what does not resolve: an unanswered or ambiguous call, an event nobody publishes,
a flow step naming no node, a duplicate id. Gaps are never refusals, since one repo's graph points at others.

Not built yet: a `stackra graph` command in `@stackra/cli` (the steps are library calls until then), the docs renderer
(stackra-60) and flow tags declared on actions and events (the flow file is the one source for now).

## Platform field types

Besides `string`, `@Int`/`@Num` numbers, `boolean`, `Date`, enums and the member's own Schema classes, a shape field
may use these platform types (each read only when declared in a `@stackra/*` package):

| Field type                                     | zod in `#stackra/schemas`                                  | JSON Schema (manifest, openapi.json)                                            |
| ---------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `PublicId<"ord">`, `Money`, `Duration`, `Json` | `publicId("ord")`, `money()`, `duration`, `json()`         | pattern, `{ minor, currency }`, `format: duration`, any                         |
| `Url`, `Email`, `CurrencyCode`                 | `url()`, `z.email()`, `currencyCode()`                     | `format: uri`, `format: email`, `^[A-Z]{3}$`                                    |
| `I18nKey` (`@stackra/i18n`, STA-1365)          | `z.string().transform((value) => value as I18nKey)`        | `string` (a string column on a model)                                           |
| `Translated` (`@stackra/model`)                | locale map `.transform((values) => Translated.of(values))` | `object` of locale tag to string, `x-stackra-type: translated`                  |
| `TranslatedStrings` (`@stackra/validation`)    | locale map `.transform((values) => ({ values }))`          | the same locale map                                                             |
| `Upload<Bucket>` (`@stackra/media`)            | `Upload.schema`                                            | `{ id: "upl_…" }`, `x-stackra-type: upload`, `x-stackra-bucket: <Bucket class>` |

A bare `PublicId` is a polymorphic reference: any registered prefix (`^[a-z]{2,6}_…`), compiled to a format check
typed `PublicId`. `PublicId<"crl" | "prl">` compiles to a union of `publicId(prefix)`. `Readonly<Record<string, X>>`
reads as the record.

A field typed with any other `@stackra/*` type (a class, an interface, an alias or a union, such as `Address`,
`ScopeRef`, `Condition` or `Audience`) reads as `shipped` when a `@stackra/*` package's `.` or `./contracts` barrel
exports `<Type>$` (STA-1290): `#stackra/schemas` imports it as `Shipped<Type>$` instead of compiling the shape again,
the JSON Schema is `{ "x-stackra-schema": "<specifier>#<Type>$" }`, and a generated client imports the same schema back.
The type's own package wins when two ship the name; a model column of that type is `json`. A package type nobody ships
is still `shape_unknown_type`. `BusinessCalendar["workingWeek"]` (an indexed access) is not read: type the field
`WorkingWeek`.

`@Str` and `@Trim` on a translated field apply to each locale's text. A model's `Translated` field gets
`TranslatedType` in its `EntitySchema`, so it loads back as a `Translated`. `Upload<X>` where `X` is not a Bucket class
is `shape_unknown_type`. A default naming an enum case the enum does not have (`QueryScope.ActiveScope` after a
rename) is `shape_default_member_unresolved`, not `shape_default_not_constant` (STA-1363). `LocalizedText`,
`IconName` and `I18nKey` ship no `X$` and stay `shape_unknown_type`: type such a field with a `@Field(zod)` hatch
(owner call, STA-1363).

Constants and defaults: literals, enum cases, literal-typed `const`s, a `const` holding a regular expression literal
(a shared pattern imported from a constants file), and the platform constructors `Duration.*`, `Money.of|ofMinor|zero`
and `Translated.of`. An override may extend its base default with `...this.<field>` (`{ ...this.errors, enabled: true }`,
`[...this.levels, X]`); gen resolves it from the class chain.

Overrides (ADR 0305 rule 1): a config over a package config, or a class that keeps the plain name of the package class
it extends. Only one per base in a member (`override_duplicate`); a class that only builds on a package class
(`ListNotesInput extends CursorInput`) is no override. A model may reuse a registered package prefix only in the member
named after that package's module (the `identity` service for `usr`); its manifest entry records `hosts`.

An action or query's `handle` answers `Promise<Output>` with a Schema class of the member. A replica query (ADR 0338)
answers `Promise<ReplicaPage>` (or `ReplicaPage<T>`) from `@stackra/actions` instead: the manifest gives it the output
`<module>.ReplicaPage` and writes that JSON Schema (rows, removed ids, cursor, `asOf`, `full`) under `schemas`, so the
OpenAPI document and the generated clients type it. Any other output is `action_handle_signature`.

## What one run writes

| File                                                                      | For                                                   | Holds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stackra.manifest.json`, `openapi.json`                                   | every member                                          | every locked identity: actions, events, permissions, refusals, models and prefixes, drivers, integrations, sequences, an app's blocks and routes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `.stackra/gen/schemas/<module>.ts`                                        | a member with a shape to register                     | `X$`, `X$Check`, `registerSchemas`, `registerChanges`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `.stackra/gen/entities/<module>.ts`                                       | a module with models                                  | `[OptionalProps]`, one `EntitySchema` per model, `<MODULE>_ENTITIES`, `registerEntities`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `.stackra/gen/wiring.ts`, `module.ts`                                     | every member                                          | the container wiring (with `repositoryOf(M)`, `journalOf(M)`, the platform services gen binds and, in a service, the `OriginGuard`/`CsrfGuard` request guards with `app.cors`/`app.csrf` and the health indicator drivers of its declared packages; in a host, the `SystemAccessibility`, `SystemSettings` and `SystemPermissions` tables defaulting to `accessibility_info`, `expo` and the app's own driver on an Expo-only app and to `memory` elsewhere, and the `AppLock`, `Passkeys`, `LiveActivities`, `DeviceSearchIndex`, `IncomingShare` and `AppIcon` tables with their config rows defaulting to `expo` the same way; a web-and-native app's native entry takes `nativeWiring`, with the native drivers as those defaults) and the member module |
| `.stackra/gen/registrations.ts`                                           | package, service                                      | `registerEntities` (hosted), `registerModelPartners`, `registerEventNames`, `registerChangeConsumers` (each `@ConsumesChanges` service with its models), `registerJobs`, `registerScheduledJobs`, `registerConnections`, `registerWebhookEvents`, `registerOutboundWebhooks`, `registerSequences`, `registerSearchableModels`, `registerCachedQueries`                                                                                                                                                                                                                                                                                                                                                                                                       |
| `.stackra/gen/boot.ts`                                                    | service                                               | `boot(container, { signal })`: the database (at the Encore database's url, the `DATABASE_REPLICA_URLS` replicas, the `DatabaseConfig` timeouts and pool, `DATABASE_POOL_MAX` over its max) with the hold, stamp and outbox writer subscribers, `segments.connect`, `EventBus#connect` and `InboxService#connect` (disconnected when `signal` aborts), the live queries' refresh routes, the relay; nothing when `signal` has already aborted                                                                                                                                                                                                                                                                                                                 |
| `.stackra/gen/webhooks.ts`                                                | service                                               | `InboundWebhooksController` on `/webhooks/<module>/<name>/:connectionId`, raw body and decoded query to `WebhookReceiver`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `.stackra/gen/clients/<service>.ts`                                       | a client consumer                                     | the producer's enums, shapes, refusals and integration events, one `remoteAction`/`remoteQuery` per call, `<Service>Client`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `.stackra/gen/settings.ts`                                                | members with a settings class and `@stackra/settings` | `Settings = settingKeys({...})`: one key per setting field of each settings class, by module (stackra-209); `Settings.pick([...])` forms compile in `#stackra/schemas`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `.stackra/gen/i18n.ts`                                                    | members with `assets/lang` and `@stackra/i18n`        | `I18n = keys({...})` from the base locale (`en`) plus the namespaces of declared Stackra packages (`@stackra/*`, or any that ships `stackra.manifest.json`) that ship `assets/lang` (`I18n.loyalty_kit.*`), `locales` from the member's locale folders, `catalogues` (one lazy JSON loader per namespace and locale file, a package's through its `./assets/*` export; runtime `dependencies` only) and `loadMessages(locale)` over them; `$comment` notes are not keys; a key no catalogue ships is refused (`i18n_key_missing`), and so is a namespace two owners ship (`i18n_namespace_clash`)                                                                                                                                                            |
| `.stackra/gen/prefixes.ts`                                                | models with ids                                       | each public id prefix with the model that mints it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `.stackra/gen/{routes,blocks}/<runtime>.ts`                               | app                                                   | `registerRoutes(routeTable)` (and `registerPanelPages()`, `registerResources(...)` over the declared manifests' `ui.resources` and `resourceLabelKeys` on the browser with the panel), `registerBlocks`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `.stackra/entry/*.ts`                                                     | every member                                          | a package's entry barrels; a service's `server` (which hands `createApp` its `boot`), an app's `browser` and `native` entries                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `.stackra/{tsdown,vitest}.config.ts`, `vitest.setup.ts`                   | package, service                                      | the build, the unit tier on the coverage gate, and the setup with registrations, wiring, factory partners, `@stackra/database/testing` and `@stackra/clients/testing` (when declared) and `await loadMemberSchemas()` (the working directory, the member root vitest runs in)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `vitest.config.ts` (member root)                                          | package, service                                      | the gitignored shim re-exporting `.stackra/vitest.config.ts`, since `vitest run` reads only the root; written only when none exists. An authored one that imports `./.stackra/vitest.config` (`mergeConfig(generated, ...)`) is kept; any other is refused (`shim_authored`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `.stackra/migrations/<seq>_<module>_<NNNN>_<stem>[_<step>].{up,down}.sql` | service                                               | every compiled migration step, the service's own and its declared packages', in apply order: number order per module, `Migration({ after })` ids first, packages first on a tie; `-- stackra:transactional=false` opens an online step; `.down.sql` only when the step has an inverse. Leftover `.sql` files are removed (reported by `--check`). Refusals: `migration_after_unknown`, `migration_cycle`, `migration_id_duplicate`, `migration_load_failed`, `migration_compile_failed`, `migration_database_missing`, `append_only_not_revoked` (an own `AppendOnly` model whose table no `t.appendOnly()` revokes `UPDATE` on)                                                                                                                             |
| `.stackra/graph.json`                                                     | every member                                          | the member's part of the system graph: modules, called services, events out and in, tables, packages, ports and driver candidates (ADR 0452)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## Generated service clients

A service reaches another service only through its generated client (ADR 0260): type a constructor parameter with it
and gen does the rest.

```ts
import type { CatalogueClient } from "#stackra/clients/catalogue";

export class StorefrontService extends Service {
  constructor(private readonly catalogue: CatalogueClient) {
    super();
  }

  async product(productId: string) {
    return this.catalogue.product.get.call({ productId });
  }
}
```

- **Token.** A parameter typed with a class imported from `#stackra/clients/<service>` is a class token by its import,
  even before the file exists, so it never raises `token_not_a_class`. The wiring binds it with one dependency, the
  `ClientTransport` the topology picks (`@stackra/clients/contracts`).
- **Source.** Discovery reads the producer's committed `stackra.manifest.json` from the folder beside the member
  (`services/catalogue` next to `services/channels`), or from a dependency that ships one. Never the producer's
  source. An app (`apps/<app>`) also reads the repo's `services/<service>`. A consumed service without a manifest is
  `client_service_unknown`, and a client imported under another name than `<Service>Client` is `client_name_mismatch`.
- **Consumers.** A service is consumed by an injected client, a listener of one of its events, or any own file
  (tests included) importing from `#stackra/clients/<service>`, so an app's route that reads a query gets the client.
- **Modules and permissions.** The client file also exports one client module per producer module
  (`class ReviewsModule extends moduleRef("channels", "reviews") {}`, for an app's `Module({ imports })`) and one
  permission set per Permissions class (`class ReviewPermissions extends permissionsRef("reviews.review", [...]) {}`,
  so `ReviewPermissions.moderate` is `"reviews.review.moderate"`). `./contracts` is types-only (ADR 0117), so these
  runtime values ship here. The manifest records each permission's `class`; an older manifest derives the name from
  the key.
- **Service keys.** `#stackra/clients/compliance-privacy` finds the producer whose manifest member is
  `compliance_privacy`: the key matches in snake or kebab case, and the file is written under the imported specifier.
- **Dependencies.** A generated file that imports a `@stackra/*` package the member does not declare in package.json
  is refused with the package to add (`client_dependency_missing`, `schema_dependency_missing`, and
  `generated_dependency_missing` for the wiring, the tool configs, the test setup and the entries), so gen never
  writes a file that fails to resolve at runtime. A schemas file also needs `zod` declared (`schema_dependency_missing`
  with subject `zod`); a member with no shape to register (only enums, configs, or shapes that ship their own `X$`)
  gets no schemas file, so it needs no zod.
- **Cycles.** Services may consume each other's clients in a cycle (catalogue and stock, sales and fulfilment): gen
  runs in two passes. Pass 1 (`stackra gen --manifests`, and the first pass of every `stackra gen`) writes each
  member's manifest without its clients; a consumed service with a folder beside the member is not a refusal there.
  Pass 2 writes the clients and everything else against those manifests, in rounds until one writes nothing. A
  refused member still writes its clients (so a shape typed with a client's enum resolves next time) and its manifest
  when only workspace services stand in the way; every other output is written only when the member is clean.
  Committed manifests are the steady state from then on.
- **Shape.** Each descriptor is named after the producer's class (`GetProductQuery`, `PlaceOrderAction`); the client
  groups them by model (`client.<model>.<verb>.call(input)`, and `.queue(input)` for an action). Shapes are
  `remoteShape` classes, enums `Enum.of`, refusals `remoteRefusal`, integration events `remoteEvent`. Entries a
  hosted package brought into the producer are left out for now.
- **Forms over remote shapes (STA-1363).** `remoteShape` is a schema kind base. `PickType(CreateOrderInput, ["lines"])`
  (also `OmitType`, `PartialType`) and `class CreateOrderForm extends RequestedLine` compile to
  `RemoteCreateOrderInput.schema.pick({ lines: true }).extend({ ...own fields })` in `#stackra/schemas`: the remote
  fields come from the client class's `schema` static, never re-read. A class extending `Settings.pick([...])` of
  `#stackra/settings` is a schema kind (no `kind_unregistered_base`).
- **Gen agrees with the `base-matches-suffix` lint (STA-1365).** No `kind_unregistered_base` for what the lint accepts:
  a class extending `Error` (any `…Error`) in an `.error.ts` file, a base-less class in a `src/testing/` `.service.ts`
  file (a harness such as `TestingApp`), and a class under
  `// oxlint-disable-next-line stackra/base-matches-suffix -- reason: …` (`Container`, `ActionPipeline`). A driver of
  `@stackra/contracts` (below the container) extends its port: no `kind_suffix_mismatch` and no constructor tokens. An
  abstract class is a kind base: never `event_base_abstract`, and its constructor (often protected) is never read; a
  class without a constructor takes the nearest one its chain declares, a package base's tokens mapped to that
  package's entries. A member off `@stackra/container` (`@stackra/testing`, rule 6c) gets no wiring, no member module
  and a setup without `@stackra/container/testing`.
- **Settings keys (stackra-209).** `emitSettings` writes `#stackra/settings`: `Settings = settingKeys({...})` with one
  key per setting field of each settings class (a section's fields flattened under the section), carrying its type
  (`boolean`, `integer` for an `@Int` number, `number`, `string` for a string, enum or brand, `connection` for a
  `PublicId<"conn">`), default, the class's scopes or the field's `@Setting({ scopes })`, `@Int`/`@Num` bounds,
  nullability, the other `@Setting` flags, section, earlier name (`@Renamed`) and the label key
  `<module>::settings.<section.>name.label`. A field of any other type gets no key. `class OrderPolicyForm extends
Settings.pick([Settings.orders.customersMayCancel])` compiles to an ordinary `OrderPolicyForm$` whose fields are the
  picked keys' fields, read from the member's own settings classes; a key written otherwise, or of a module whose
  settings class is not the member's own, is `settings_key_unresolved`.
- **Lang (STA-1363).** The `assets/lang` of every consumed service (found like its manifest) is merged into `I18n`
  beside the member's and its packages', so an app's `I18n.orders.*` resolves to the commerce service's namespace;
  its loaders import the service's files relative to the member. A clash with the member's or a package's namespace is
  still `i18n_namespace_clash`.
- **Events.** A listener subscribes to another service's integration event by importing its class from the client
  file and typing `handle` with it; the wire name (`<module>.<name>.v<n>`, ADR 0141) comes from the producer's
  manifest. There is no wire-name subscription: an event the producer does not publish is `client_event_unknown`, and a
  `handle` parameter that is no event class is `listener_handle_signature`. A service consumed only by a listener still
  gets its client file. The registrations then name the event's wire name (so the inbox rebuilds it) and the pair; both
  calls come from `@stackra/events` (STA-1387: below `@stackra/actions`, so no member needs the outbox to register):

  ```ts
  import type { AppApproved } from "#stackra/clients/developer";

  export class ListOnAppApprovedListener extends Listener({ queue: Queues.Default }) {
    async handle(event: AppApproved, ctx: ListenerContext): Promise<void> { ... }
  }
  // .stackra/gen/registrations.ts (generated)
  registerEventNames([{ type: AppApproved, name: "developer.app.approved.v1" }]);
  registerListeners([[AppApproved, ListOnAppApprovedListener]]);
  ```

  A relay (the webhooks relay) types `handle` with `EventEnvelope` from `@stackra/outbox/contracts` and is written as
  `registerRelays([...])`: the inbox hands it every claimed envelope, typed payload or not.

- **Import map.** The member's `#stackra/*` import (`./.stackra/gen/*`) already resolves `#stackra/clients/<service>`;
  nothing else is needed.
- **Tests.** Replace the client with `fakeClient()` from `@stackra/clients/testing` through
  `createTestingModule(...).override(CatalogueClient, fake)`.

## The contract test

```ts
import { expectBackwardCompatible, loadManifest, previousRelease } from "@stackra/gen/testing";

it("only adds to the last release", async () => {
  expectBackwardCompatible(
    await previousRelease("@acme/loyalty-kit"),
    await loadManifest("./stackra.manifest.json"),
  );
});
```

## Class components

`class Counter extends Component<CounterProps>` (with `Component` from `#stackra/ui`) compiles to
`function Counter(props: CounterProps)`: fields become state, `use*` fields hooks, methods functions, `mount()` and
`unmount()` one effect, `render()` the body. The generated Vite config puts `classComponents()` first; the generated
Metro config sets `babelTransformerPath` to `@stackra/gen/metro-transformer`.

## Encore jobs and queues

A service's full run writes `.stackra/encore/encore.app`, `{ "id": <app id>, "lang": "typescript" }`, so `encore run`
in `.stackra/encore` (what `stackra dev` starts) finds its app (ADR 0091 decision 2). The id is the root runway's
`providers.encore.app` (the `runway.yaml` beside `pnpm-workspace.yaml`); without it gen refuses with
`encore_app_missing` rather than invent one. Any run refuses an `encore.app` at the member root or the repository root
(`encore_app_stray`, ADR 0029): gen writes the only one (STA-1322).

For a service, gen writes the first parts of the Encore app (ADR 0148): `.stackra/encore/<member>/cron.ts` holds one
`CronJob` per action whose `job` has a `cron` (its endpoint calls `SchedulerService.fire(<locked key>)`; ids by
`cronJobId`, which `encoreCronJobs()` also calls) and the stored schedules' minute tick; `.stackra/encore/<member>/queues.ts`
holds one Pub/Sub `Topic` and `Subscription` per queue its job actions name, registered as `queue.<name>` for a
broker-delivered queue driver, each delivery run through `QueueWorkerService.process`. Both reach the member through the
server app's `handlers`.

`.stackra/encore/<member>/events.ts` holds one Pub/Sub `Topic` per integration event the manifest publishes, registered
under its `<module>.<name>.v<n>` wire name for the outbox's `broker` publisher. A service with a relay listener (the
webhooks relay, ADR 0260 decision 4) also gets `.stackra/encore/<member>/relay.ts`: one `Subscription` per integration
topic of the product, its own and every publishing service's beside it (`readPublisherManifests` fills
`MemberIR.publishers`), each delivery handed to `InboxService#receive`. No producer is edited to add the relay; a new
publishing service is heard on the relay service's next gen run. A service whose listeners take a
`#stackra/clients/<service>` event gets `.stackra/encore/<member>/subscriptions.ts`: one `Subscription` per consumed
event (named `<member>-<wire name>`) on the producer's generated topic, imported from its `events.ts` like the relay's,
each delivery handed to `InboxService#receive`, which runs the typed listeners; a wire name the service's relay already
hears gets none. A local listener of the service's own integration event gets one too, on its own topic from
`./events` (STA-1302), so a deploy on the broker driver still runs it once, after commit. The cross-service topic imports of `relay.ts` and `subscriptions.ts` are not yet checked by an Encore
build (STA-597). The manifest also locks each Integration's egress entry from its `baseUrl`: a fixed https
origin, or a `{field}` host kept as data with the credential-set fields it is filled from (`egress_invalid` otherwise),
and refuses a sequence outside `database/sequences/` (`sequence_misplaced`), a `@DocumentNumber` field whose sequence
is declared neither in the member nor in a dependency (`document_number_unsequenced`), and two cron actions with one
CronJob id (`cron_job_collision`). Effect tags are snake_case (`external_communication`). Each declared rule outcome
kind (`class X extends RuleOutcome({ key, label, params })`, `@stackra/rules`) is listed in `outcomes` as
`<module>.<key>` with its label and parameters, locked by class like a sequence. The boot connects the bound `HoldRegistry` and `SequenceTimeZone` and registers the legal-hold
subscriber; the wiring binds `SequenceService`, and `SettingsReader` with the market floor source, where injected.
A service that injects `RuleSetService` (`@stackra/rules/node`) gets the rules node without wiring it by hand: the
wiring binds it over `repositoryOf(Revision)` (content's revisions table) and the registrations write
`registerModelPartners([[RuleSetService, RuleSet]])`; the `RuleSet` and `Revision` entities come from the hosted
packages' entity lists. `MediaLibrary` is bound the same way over the `FileSystem` disk and `MediaConfig` (ADR 0465).

The wiring's driver tables hold the member's own drivers and, for every port its bindings reach (directly, through a
platform binding or through another driver's constructor), the declared package's table from that package's
manifest: each candidate (`memory`, `postgres`, `valkey`, ...) as a lazy import of its public entry, its constructor
tokens, the field that selects one, and a config row for each injected class the package's manifest lists in its
`config` section (STA-1297, STA-1308; never guessed from a `Config` suffix). So
`createTestingModule(X).useDrivers("memory")` finds the packages' memory drivers, and production finds the postgres
and valkey ones through the same rows. A package's `DriverRegistry` names stay its own augmentation. A
`Projection<Row>({ key })` class (`@stackra/database`) is a binding like a service: its
listeners and queries inject it.

## Encore database (stackra-250)

A service with a database (it declares `@stackra/database`, or a model is its own or a declared package's) gets
`.stackra/encore/<member>/database.ts`: one `SQLDatabase` named after the member in snake case, whose `migrations` are
the compiled `.stackra/migrations` folder, so Encore provisions the service's own logical database and role and applies
its migrations (ADR 0238 decisions 1 to 3, ADR 0159). `#stackra/boot` connects with `database.connectionString`, the read
replicas of `DATABASE_REPLICA_URLS` (comma-separated, set by runway where `readReplica` is on; none when unset), the
bound `DatabaseConfig`'s session `timeouts` and `pool` (with `DATABASE_POOL_MAX`, the instance's share of the runway
`poolBudget`, over its `max`, ADR 0473), and the hold, `StampSubscriber`, `AppendOnlySubscriber`, encrypted-fields and outbox writer
subscribers.
A model with a subscriber trait, own or a declared package's, adds its subscriber after `AppendOnlySubscriber`
(`traitSubscribers`): `TreeSubscriber` for `HasTree` (STA-1419), then
`ValidateOnFlushSubscriber` for `ValidateOnFlush` (STA-1410), so a row is checked in clear before it is sealed.

## HTTP adapter, guards and health (STA-1385)

A service that declares `@stackra/app` gets `.stackra/encore/<member>/http.ts`: `answerHttp(request, handle)`, which
every generated raw endpoint answers through inside `app.handlers.run`. An `OPTIONS` preflight gets 204 and
`corsHeaders(request, CorsConfig)`; every other answer gets the same headers (`Vary` appended), and
`Cache-Control: private, no-store` when `apiCacheControl` forces it (ADR 0325 rule 22: a signed-in request or an
answer that sets a cookie). When the service also declares `@stackra/errors`, a `RateLimitedError` from `handle`
answers 429 with its envelope and `rateLimitHeaders` (`Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining`,
`RateLimit-Reset`; ADR 0217, STA-1477); other errors propagate. The wiring of such a
service binds `OriginGuard` and `CsrfGuard` with the `app.cors` and `app.csrf` config rows, and one binding per
`HealthIndicator` driver of a declared package (`@stackra/database/node`, `@stackra/cache`, `@stackra/queue`,
`@stackra/realtime`, `@stackra/filesystem`, `@stackra/search`) with its package config row, so `/readyz` checks them
with no hand wiring (`SERVER_CONTRIBUTIONS`). A package manifest's own config row, or a host override, wins over these
rows. The search indicator refuses an empty `search.health.table` when it is built, so a service with
`@stackra/search` names one. `AgentRuntime` is bound with `AiMeter` (over the outbox) and `DiscoveryService`.

On an app's browser with the panel, gen writes `registerResources({ "<module>.<model>": tree })` from the
`ui.resources` sections of the declared manifests (the first manifest that records a key wins) and
`resourceLabelKeys`, the `<module>::resources.<model>.<part>.<path>` keys the resource pages derive (title, columns,
filters, entries, sections, fields, steps; not relations or actions), for the catalogues.

## Call options from a request (design, ADR 0472)

No generated endpoint calls the pipeline yet (the action endpoints come with the rest of the Encore app). When they
do, each builds its `CallOptions` in two parts and nothing else: the verified facts from the credential (`actor`,
`scope`, `device`, `origin`, `sandbox`, `assurance`; ADR 0098, never a header or the body) and the header-borne values
the pipeline checks itself, lifted by `requestCallOptions(request)` of `@stackra/actions`: `Idempotency-Key` onto
`idempotencyKey` (the idempotency step, ADR 0138) and `Stackra-Consent` onto `consentSnapshot` (verified by
`ctx.consent()`, ADR 0472). The header names are `CALL_HEADERS` of `@stackra/actions/contracts`.

```ts
await pipeline.execute(X, input, { actor, ...requestCallOptions(request) });
```

The emitter calls the function instead of writing header reads into each endpoint, so a new header-borne option is one
change in `@stackra/actions` and no gen change; adding it adds no pipeline step (ADR 0138).

## Client tools (ADR 0490, STA-1631)

For an app, `emitClientTools` writes `.stackra/gen/client-tools.ts` (`#stackra/client-tools`): the app key, a hash and one
L0 row per tool the agent may call to change the viewer's screen, grouped by declaring module. Rows come from the
routes (`navigate.<route>`, input the `:param` segments), the panel resources of the dependency manifests' `ui.resources`
(`<resource>.list.open`, `.list.filter`, `.list.sort`, `.list.select`, `.view.apply`, `.record.open`), every placed action
that is a tool (`<resource>.<verb>.prefill`), `ui.theme|mode|density.preview` for an app declaring `@stackra/theming`,
`tour.start|next|stop` once the app declares a `tour`, and `ui.point` at the `anchor="..."` keys. `ai: false` on a route,
a resource tree or a placement opts out; `defineApp({ ai: false })` opts the app out. Refusals: `client_tool_collision`,
`prefill_tool_off`, `anchor_undeclared` and `context_record_not_public_id`. Anchors are read by `readAnchors` (a text scan).

## Public SDKs

An action or query marked `public: true` (OS ADR 0039 d2; Stackra ADR 0217, 2026-10-26 note) is written to the
manifest as `public`; one with no endpoint is refused (`public_without_endpoint`). `emitSdks` writes, for a service or
app with a public entry, `.stackra/sdks/typescript/index.ts` (typed from the reachable schemas),
`.stackra/sdks/python/<member>_client.py` (standard library) and `.stackra/sdks/php/<Member>Client.php` (no
dependency): one method per public entry, with the bearer token, `Stackra-Version` and `Idempotency-Key` headers and
the ADR 0140 envelope as `ApiError`. Only public entries are ever written; packaging and publishing are the release
pipeline's.

## Golden snapshots (STA-1320)

`__golden__/` holds one fixture workspace per member kind (service, package with drivers, app with clients, docs
app, consumer of another service's manifest, package lang) and one per whole-run refusal, each with its committed
expected output. `src/node/__tests__/golden.test.ts` runs gen over them and diffs. Refresh deliberately, on ci-box:
`UPDATE_GOLDEN=1 pnpm --filter @stackra/gen exec vitest run src/node/__tests__/golden.test.ts`. Layout and fixtures:
`__golden__/README.md`.

## The Expo config (ADR 0295 decisions 2 to 5)

An app whose `defineApp` lists `Target.Ios` or `Target.Android` gets `.stackra/app.config.ts` and a gitignored root
`app.config.ts` that re-exports it, since the Expo CLI reads only the member root. `readAppDefinition` reads the
`defineApp` argument as static data (`staticLiteral`, never by running it) and the brand kit's alternate icon sets,
one PascalCase folder each under `assets/app-icons/<Name>/` holding `app-icon-ios-1024.png` and
`app-icon-android-foreground-1024.png`.

The smallest design of the sections, until `AppDefinition` types them (STA-339):

```ts
export default defineApp({
  targets: [Target.Ios, Target.Android],
  area: ApiArea.App,
  name: "Acme",
  scheme: "acme",
  ios: { bundleId: "com.acme.app", supportsTablet: true },
  android: { package: "com.acme.app" },
  // The Expo config minus the owned keys: passed through as written.
  expo: {
    orientation: "default",
    ios: { config: { usesNonExemptEncryption: false } },
    plugins: ["react-native-bottom-tabs"],
  },
});
```

| Gen writes                                                                      | From                                                                                                       |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `name`, `slug` (the scheme), `scheme`, `version`                                | `defineApp` and the package version                                                                        |
| `ios.bundleIdentifier`, `ios.supportsTablet`, `android.package`                 | `ios.bundleId`, `ios.supportsTablet`, `android.package`                                                    |
| expo-localization `supportsRTL`, `supportedLocales`                             | `I18nConfig.locales` and `rtl` (the host override, else the base defaults)                                 |
| `ios.associatedDomains: ["webcredentials:<host>"]`                              | an https `IdentityConfig.issuer`, when the app declares `@stackra/identity`                                |
| expo-widgets `groupIdentifier: "group.<bundleId>"`, `NSSupportsLiveActivities`  | the app declaring `expo-widgets`                                                                           |
| expo-alternate-app-icons, one entry per icon set                                | `assets/app-icons/`; the background is the section's `android.adaptiveIcon` colour                         |
| `@stackra/native-share`, `@stackra/native-spotlight`                            | the app declaring the package                                                                              |
| expo-location (when in use only), expo-media-library, expo-local-authentication | their text from the base locale's `permissions` namespace (`location`, `photos`, `save_photos`, `face_id`) |

Owned plugins follow the section's own, in that order, and each is written only when the app declares its package.
Refusals: `expo_owned_key` (the `expo` section sets an owned key or lists an owned plugin), `expo_identity_missing`,
`expo_permission_text_missing`, `app_icon_drift` (the host's `AppIconConfig.icons` differ from the icon sets: gen
checks the override rather than writing into `src/`), `app_definition_not_static`, and `shim_authored` for an authored
`app.json` or `app.config.ts` at the root. Not yet: applying `expo.extend.ts`, a per-environment issuer from runway
(the passkey domain comes from the override's literal), and the permission text of the other locales.

## Not here

Per-target outputs land with the target that owns them: an app's browser clients, navigation trees and the `keys` `toRoot` takes,
panels, resources and widgets, flags, settings pages, the typed `#stackra/migrations` ids, the rest of the Encore app (the server entry
hands `boot` to `createApp`, whose `EventBus` and `InboxService` connects make the relays and typed subscribers receive), the Vite, Metro, Wrangler and electron-builder configs, and the worker and desktop main
entries. The per-kind registrations of actions, permissions, roles, policies, listeners, extensions, workflows,
buckets and segment subjects come with those targets too.
