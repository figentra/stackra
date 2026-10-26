# AGENTS — @stackra/gen

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/gen: where code goes, entries and barrels, the package rules (generated service
         clients and the manifest and clients passes included), the rules that fail the build and PII.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0294; ADR 0295; ADR 0305; ADR 0260 (generated clients and typed events); ADR 0263; ADR 0162 and ADR 0222
                    (the translated and upload shape kinds); ADR 0338 (a replica query's `ReplicaPage` output); STA-1290 (the shipped shape kind); STA-1293 (i18n, clients for apps, undeclared packages); STA-1296 (client modules and permission sets, config overrides, the root Vitest shim).
-->

The Stackra compiler. Member at `packages/developer/gen` (`tier:lib`), in the programming model v3.1 shape (ADR 0294,
0305). Entries `.`, `./node`, `./testing` and the `./metro-transformer` tool hook (ADR 0127, 2026-10-24 note).

## Where code goes

| You are writing…                                    | It goes in…                                 |
| --------------------------------------------------- | ------------------------------------------- |
| A pure formula or emitter (IR in, text out)         | `src/core/functions/<name>.function.ts`     |
| Discovery, the host seam, file writing, Vite plugin | `src/node/functions/`                       |
| The manifest contract helpers                       | `src/testing/functions/`                    |
| Metro's transformer                                 | `src/metro-transformer/functions/`          |
| Constants and types                                 | `src/<entry>/{constants,types}/`            |
| A test                                              | `__tests__/<name>.<kind>.test.ts` beside it |

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
  `generated_dependency_missing`). When a target starts importing a new platform package, expect members to need that
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
  (`{ <name>: { class, from, deps? } }`: the class, its public entry from `packageSpecifier`, its constructor tokens
  with `#…` subpaths mapped by `publicSpecifier`) and `config` (`{ class, from }`, the config class whose field
  selects one). `emitWiring` reads them (`dependencyDriverTables`) and lists a package's table only for a port its
  bindings reach (the `used` worklist: bindings, platform bindings and driver constructors, transitively), merged
  under the member's own candidates (own name wins). A package `*Config` class a reached token names gets a config
  row (key from `configKeyOf` and the package's member) unless the member overrides it. The `DriverRegistry`
  augmentation lists the member's own drivers only: packages augment their own ports. A package manifest written
  before this change has no `classes` and contributes nothing until the package is generated again. Test-only
  candidates (a `ClientFake` transport) are testing plugins, never manifest rows.
- i18n (STA-1293): `readCatalogues` reads `assets/lang/<locale>/*.json`; `emitI18n` writes `#stackra/i18n` (`I18n`
  through `keys()` of `@stackra/i18n`, `locales`) only when the member declares `@stackra/i18n`. A `@Field(zod)` hatch
  carries the named imports its source uses (`TypeDesc` hatch `imports`); a nullable field gets `.nullable()` once.
- Cycles between services (ADR 0260, STA-1232): a manifest never depends on a client. `generateMember(ir, previous,
{ pass: "manifests" })` returns the manifest alone and skips (`emitClients`'s `pending`) the consumed services in
  `ir.workspaceServices` (a folder beside the member); `{ pass: "clients" }` returns the client files alone. `generate`
  writes the clients of a refused run, rediscovers once, and still writes its manifest when the manifest pass is clean;
  every other output keeps "nothing written on error". Never make a manifest field depend on a consumed client.
- Events across services (ADR 0260 decision 4): a listener's `handle` parameter is read into `DeclaredClass.handle`
  (`event`, a `ClassRef`, or `relay` for `EventEnvelope` from `@stackra/outbox`). A `#stackra/clients/<service>` event
  makes that service consumed (discovery and `emitClients`) and must be one of its integration events
  (`client_event_unknown`); `emitRegistrations` writes `registerListeners`, the consumed events' wire names into
  `registerEventNames` and `registerRelays`. Never add a subscription by wire name.
- Event transport (ADR 0260 decision 4, ADR 0148): `emitEncoreEvents` writes a service's integration event topics
  (`events.ts`, registered by wire name) and, for a relay service only, `relay.ts`, which subscribes to every topic of
  the product from each publisher's generated `events.ts`. Discovery reads the publishers (`readPublisherManifests`)
  only for a member with a relay. A typed consumer (a listener of a `#stackra/clients/<service>` event) gets
  `subscriptions.ts`, one subscription per consumed event on the producer's topic (folder from `MemberIR.services`),
  into the inbox; a wire name its relay hears is left to the relay. Never make a producer list its subscribers.
- The shape vocabulary is `TypeDesc` (`src/core/types/type-desc.type.ts`). A new platform field type is one
  `TypeDesc` kind read in `readTypeReference` (only when declared in a `@stackra/*` package) and one case in each of
  `emitSchemas`, `jsonSchemaOf` and, for a model column, `emitEntities`, with tests. `Translated` and
  `TranslatedStrings` are `translated`; `Upload<Bucket>` is `upload` and its argument must be a Bucket class.
  Any other `@stackra/*` type whose `<Type>$` a `.` or `./contracts` barrel exports is `shipped` (STA-1290): imported
  as `Shipped<Type>$`, never compiled again; its JSON Schema is `x-stackra-schema`. Never add a hand-kept table of
  shipped schemas: the barrels are the source (`shippedSpecifier`).
- `handle`'s output is a Schema class of the member, or `ReplicaPage` (any type argument) declared in a `@stackra/*`
  package for a replica query (ADR 0338): the reader records `handle.replica` and `buildManifest` writes
  `REPLICA_PAGE_SCHEMA` as `<module>.ReplicaPage`. Keep that constant in step with `ReplicaPage` in
  `@stackra/actions` and `REPLICA_CHANGES_SCHEMA` in `@stackra/query`.
- `generateMember` runs every emitter; `generate` (and so `stackra gen`) writes what it returns. A new output is an
  emitter in `src/core/functions/` called from `generateMember`, with its test.
- `emitBoot` is the only place a service's connect calls are written, in order after the container is ready: database,
  segments, `EventBus#connect` and `InboxService#connect` (disconnected when the shutdown signal aborts), then the
  relay. Without the bus and inbox connects, relays and typed subscribers receive nothing. A signal already aborted
  connects nothing. The server entry passes `boot` to `createApp` (`@stackra/app/server`), which calls it with
  `DATABASE_URL` and aborts the signal on `close()`.

- Platform services (ADR 0263): a `@stackra/*` service gen binds where injected is a `PLATFORM_BINDINGS` row
  (`MediaLibrary` included, STA-1297); a token
  may be a per-model token (`{ class: Revision, of: repositoryOf }`). A platform `CrudService<M>` also has a
  `PLATFORM_PARTNERS` row, so the host's registrations write its model partner (`RuleSetService` over `RuleSet`, the
  `@stackra/rules` node of ADR 0331). Keep both maps in step.
- `Projection` (ADR 0294 d16, ADR 0163 d1) is a binding kind declared in `@stackra/database`; gen binds it like a
  service. Its rows are that package's versions table, so gen writes no entity or migration for it.

- Public API (OS ADR 0039 d2 and d3): only a manifest entry with `public: true` reaches `emitSdks`; never publish by
  `area`. SDKs come from the manifest, never from `openapi.json` (ADR 0158). A new language is one function in
  `emit-sdks.function.ts` with its test; package names and registries stay the release pipeline's.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

None. Gen reads source code and writes generated code and manifests; it handles no personal data.
