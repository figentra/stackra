# Feature Specification: @stackra/container, the DI container port

**Feature Branch**: `figentra/sta-76-container-spec`

**Created**: 2026-10-20

**Status**: Draft <!-- Draft → Clarified → Planned → Ready → Implementing → Verified, or Abandoned / Superseded; spec-gate ci checks the artifacts each stage needs -->

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

<!-- Folder: .agents/specs/sta-n-<slug>/, named by the Linear key below (ADR 0120 D1). -->

**Linear**: STA-76

**Linear project**: Foundation kernel

**Clarifications status**: pending <!-- /speckit.clarify sets this to "complete" when nothing is open -->

**Input**: User description: "Port `@figentra-os/container` to `packages/foundation/container` as `@stackra/container`, as-is after the Encore plus legacy-decorator spike (roadmap W1.2, ADR 0084, Round 8 F3): WeakMap metadata, @Injectable/@Inject/@Module, createDecorator/createParamDecorator, and scan + plan without instantiating (ADR 0090)."

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/container (new). Consumes packages/foundation/contracts (STA-74) for `Diagnostic`, `diagnostic()`, `sortDiagnostics()` and the STK catalogue entries; does not consume packages/foundation/support (ADR 0005 D4)
- **Cross-service events**: none. The in-process `ContainerEvent` channel (`container.emit`, `subscribe`) is not a cross-service event and never leaves the process
- **Tenancy and data**: none. No tables, no tenant-owned data; scoped containers carry a caller-supplied payload but the container never reads it
- **Secrets**: none. Every source file keeps the `Secrets: forbidden` file contract
- **ADR needed**: yes: the package design record required for every port by ADR 0018 (roadmap common definition of done), recording the WeakMap store, the three-phase engine and the creators of ADR 0117 C2
- **New dependencies**: none at runtime. Dev only, already used by the source: `fast-check`, `jsdom`, `@testing-library/react`, `react`, `react-dom`, `@types/react`, `@types/react-dom`, each from an existing pnpm catalog if present, else added to a catalog by dependency-steward. `react` stays an optional peer
- **Deploy modes**: same in all three. The container is in-process code with no outbound calls, no hosted service and no licence check (ADR 0076 D1–D3); it is not a driver package, so ADR 0076 D5's conformance suite does not apply
- **Lane**: full (ADR 0120 D4: a new package is R2, and lite requires R0–R1; see Assumptions on the roadmap's "lite")
- **Change risk**: R2 (ADR 0120 D16: a new package with a public contract that every runtime member imports)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Wire a service from its root module (Priority: P1)

A package or service author declares providers with `@Injectable`, `@Inject(token)` and `@Module({ imports, providers, exports })`, builds one container from the root module with `Container.create(Root)`, runs `init()` and `close(signal)`, and resolves providers by token in every host (Encore, Vite, React Native, plain TypeScript).

**Why this priority**: every other Phase 1+ package (config, logger, events, storage, app) boots on it (roadmap W1.2, W1.3; ADR 0042 D1, D3).

**Independent Test**: a fixture module graph with singleton, scoped and transient providers resolves, runs its hooks in plan order and disposes in reverse order under vitest, with no `reflect-metadata` installed.

**Acceptance Scenarios**:

1. **Given** a module importing another that exports `LOGGER`, **When** `Container.create(AppModule)` runs, **Then** a provider injecting `LOGGER` receives the exported value and an unexported provider is not visible to the importer (ADR 0042 D4).
2. **Given** a constructor parameter without `@Inject` or `@Dependencies`, **When** the graph is planned, **Then** planning fails with a coded STK diagnostic rather than inferring the type (ADR 0005 D3).
3. **Given** an initialised container, **When** `close("SIGTERM")` runs, **Then** `onModuleDestroy`, `beforeApplicationShutdown`, disposal and `onApplicationShutdown` run in reverse plan order and later `get()` calls throw `ContainerDisposedError`.

---

### User Story 2 - Discover decorated classes without instantiating (Priority: P1)

`stackra gen` imports a member's root module in Node and calls `scan` and `plan` (or `planModule`) only, then reads decorator metadata through `DiscoveryService`, `Reflector` and `MetadataScanner` to find controllers, actions, handlers and crons, including those declared in package modules (ADR 0090 D1–D2; Round 9 G2).

**Why this priority**: the codegen phase (W3.x) and the generated Encore app (ADR 0091 D2, D7) depend on it, and it is the roadmap's "Done when" for this row.

**Independent Test**: plan a fixture graph whose provider constructors throw; scan and plan succeed, `serializePlan(plan)` matches a snapshot, and no constructor ran.

**Acceptance Scenarios**:

1. **Given** a root module whose providers' constructors throw, **When** `planModule(Root)` runs, **Then** it returns a plan and diagnostics and calls no constructor or factory.
2. **Given** the same graph planned twice, **When** both plans are serialised, **Then** the outputs are byte-identical (deterministic order).
3. **Given** a class reachable only from a module that is not imported by the root, **When** discovery runs, **Then** the class is absent (ADR 0090 consequence 3).

---

### User Story 3 - Own a package's decorators with the creators (Priority: P1)

A package author defines that package's own decorators (for example `@OnEvent` in events, `@Cron` in scheduler) with the container's creators and reads them back through discovery, so no separate decorators package is needed (ADR 0117 C2; ADR 0094 D5).

**Why this priority**: ADR 0117 C2 makes the creators part of the container core, and W1.3 packages (validation, events) need them immediately.

**Independent Test**: define a class decorator, a method decorator and a parameter decorator with the creators, apply them to a provider, and read the metadata back from a plan without instantiating.

**Acceptance Scenarios**:

1. **Given** `const Roles = createDecorator<string[]>()`, **When** a method is decorated with `@Roles(["admin"])`, **Then** `Reflector.get(Roles, method)` returns `["admin"]` and nothing is written to `Reflect`.
2. **Given** a parameter decorator built with `createParamDecorator`, **When** it decorates a handler parameter, **Then** discovery exposes the parameter index and the decorator's data.

---

### User Story 4 - Swap providers in tests (Priority: P2)

A test author builds a module with `Test.createTestingModule`, `overrideProvider()` and `overrideModule()`, or uses `createMockContainer`, from `@stackra/container/testing` (ADR 0042 consequence 1).

**Why this priority**: every package's unit tests depend on it, but runtime wiring (P1) must exist first.

**Independent Test**: override a provider by token and assert that diagnostics describe the overridden graph.

**Acceptance Scenarios**:

1. **Given** a module importing `Mailer`, **When** `overrideProvider(Mailer).useValue(fake)` is applied, **Then** every declaration of `Mailer` is replaced before planning.

---

### User Story 5 - Use the container from React, React Native and Node hosts (Priority: P3)

An app author uses `ContainerProvider`, `ScopeProvider` and the hooks from `./react`, `bindAppState` from `./native`, `enableShutdownHooks` and `createScopeStorage` from `./node`, and `registerContainerDevtools` from `./devtools`.

**Why this priority**: the apps reach these in Phase 7; the server path needs only core, `./contracts`, `./node` and `./testing`.

**Independent Test**: the ported host-entry tests (including the React host e2e test) pass unchanged apart from names.

**Acceptance Scenarios**:

1. **Given** a `ContainerProvider` around a component, **When** the component calls the resolve hook for a token, **Then** it receives the provider instance.
2. **Given** the `./node` entry, **When** the process receives SIGTERM after `enableShutdownHooks(container)`, **Then** `close("SIGTERM")` runs once.

### Edge Cases

- A dependency cycle without `forwardRef` or a lazy edge: plan reports a coded error and nothing is instantiated.
- A singleton that depends on a scoped provider or `SCOPE_PAYLOAD`: widened to scoped with a warning; an explicit `singleton` scope is an error (source FCN2001, FCN1006).
- `get()` meets an async factory: `AsyncFactoryError`; `resolve()` awaits it.
- A `Lazy<T>` called during its target's construction: `LazyReentrancyError`.
- A hook fails during `init()`: `init()` aborts and can be retried; during `close()`: every step still runs and failures are thrown as one `AggregateError`.
- `loadModule` fails: the container is unchanged (`toGraph()` before equals after); `unloadModule` of a module still in use refuses with `ModuleInUseError` and changes nothing.
- An unregistered `@Module` collection key: `InvalidModuleMetadataError`.
- `forRootAsync` options resolve with names different from the declared `names`: a coded error at resolution.
- A module file with import-time side effects: gen still imports it; ADR 0090 consequence 2 puts side effects in providers, which the container never instantiates during scan or plan.

## Requirements _(mandatory)_

Requirements use EARS (ubiquitous, event-driven "When", state-driven "While", unwanted "If … then"). Source paths are relative to `/Users/akouta/Projects/figentra/packages/os/foundation/container`.

### Functional Requirements

**Port scope and identity**

- **FR-001**: The package shall be published as `@stackra/container` at `packages/foundation/container`, `tier:lib`, MIT, ported from `@figentra-os/container` with its behaviour unchanged (ADR 0084 row "container: port as-is"; Round 8 F3; ADR 0083 names; ADR 0024 relicence).
- **FR-002**: The package shall expose the source's seven entries, `.`, `./contracts`, `./testing`, `./react`, `./native`, `./node` and `./devtools`, each with the exports listed in the source README "Entries" table, renamed from `@figentra-os/container` to `@stackra/container` (source `package.json` `exports`; FW1 a lists these entry names) [NEEDS CLARIFICATION: FW1 — recommended: a, entries first with `config/` and `resources/` outside `src`; the container has neither].
- **FR-003**: The package's only runtime dependency shall be `@stackra/contracts`, as in the source (`dependencies: { "@figentra-os/contracts" }`); `react` shall stay an optional peer used only by `./react` and `./native` (ADR 0005 D4: the container core never imports the support package).
- **FR-004**: The package shall emit compiled `dist` exports per ADR 0025 and extend the `@stackra/typescript-config/decorators`, oxlint `decorators` and vitest decorators presets (ADR 0005 D5).

**Declarations and metadata (ADR 0005, ADR 0117 C2)**

- **FR-010**: The core shall provide `@Injectable`, `@Inject`, `@Optional`, `@Dependencies`, `@Global`, `@Module` and `@SetMetadata` as legacy decorators (source `src/core/decorators/`; ADR 0005 D2).
- **FR-011**: The core shall store all decorator metadata in its own `WeakMap` store (`metadata.define/get/getOwn/has/keys`, source `src/core/metadata/metadata-store.ts`) and shall never read `design:paramtypes` or call `Reflect.defineMetadata` or `Reflect.getMetadata` (ADR 0005 D3; ADR 0084 decision 1).
- **FR-012**: If a constructor parameter names no token, then planning shall report a coded STK error instead of inferring a type (ADR 0005 D3).
- **FR-013**: The core shall export `defineToken<T>(name)` as the only `define*` factory, plus `forwardRef`, `lazy` and `tokenName` (ADR 0005 D2; source README "Entries").
- **FR-014**: The core shall export the creators `createDecorator` and `createParamDecorator` for packages to build their own decorators on the WeakMap store (ADR 0117 C2; roadmap W1.2 "Done when"). The source provides `Reflector.createDecorator`, `DiscoveryService.createDecorator` and `createDiscoverableDecorator` but no parameter-decorator creator (source `src/core/discovery/`), so this is the one addition beyond "as-is"; existing names remain exported.
- **FR-015**: `@Module` shall reject any collection key that is neither core nor registered through `registerModuleCollection`, and `ModuleCollections` shall stay augmentable by declaration merging on `@stackra/container/contracts` (source README "Module collections").

**Scan, plan and discovery (ADR 0090)**

- **FR-020**: `scan(root)` and `plan(graph)` / `planModule(root)` shall be pure and synchronous and shall instantiate no provider, call no factory and run no hook (ADR 0090 D2; source README "The three-phase engine").
- **FR-021**: When the same module graph is planned twice, the container shall produce the same provider order and a byte-identical `serializePlan` output.
- **FR-022**: `DiscoveryService`, `Reflector` and `MetadataScanner` shall read decorator metadata from a plan without instantiating (ADR 0090 D2).
- **FR-023**: The plan shall enforce explicit exports: a provider not listed in its module's `exports` is invisible to importers (ADR 0042 D4).
- **FR-024**: `assertPlan` shall throw `PlanError` carrying the sorted error diagnostics when a plan has any error.

**Diagnostics (ADR 0084 decision 1, X3)**

- **FR-030**: Every diagnostic the container emits shall use a code from the `@stackra/contracts` diagnostics catalogue with the `STK` prefix, replacing the source's `FCN0001`–`FCN0016`, `FCN1001`–`FCN1014` and `FCN2001`–`FCN2003` one for one with their severities, messages and hints unchanged (Round 9 X3; source catalogue in `@figentra-os/contracts` `src/diagnostics.ts`).
- **FR-031**: The container shall build diagnostics only through the contracts helpers (`diagnostic`, `sortDiagnostics`, `hasErrors`), and shall define no codes of its own outside that catalogue.

**Runtime**

- **FR-040**: `Container.create(root, options)` shall execute the plan in order with `singleton`, `scoped` and `transient` lifetimes, provider-level `lazy`, `Lazy<T>` edges and the built-in tokens `SCOPE_PAYLOAD`, `INQUIRER`, `CONTAINER`, `ModuleRef`, `LazyModuleLoader`, `DiscoveryService` and `Reflector` (source README "Runtime" and "Built-in tokens").
- **FR-041**: When `init()` runs, the container shall call `onModuleInit` and then `onApplicationBootstrap` on every singleton in plan order, awaiting each; `init()` shall be idempotent.
- **FR-042**: When `close(signal)` runs, the container shall run destroy, before-shutdown, disposal and shutdown in reverse plan order, run every step even after a failure, and throw collected failures as one `AggregateError`.
- **FR-043**: If a constructor, factory or property setter throws, then the container shall raise `InstantiationError` with the original as `cause` and the dependency path, and retry on the next request.
- **FR-044**: `loadModule` and `unloadModule` shall re-plan atomically, keep every existing instance, and leave the container unchanged on failure.
- **FR-045**: `createInstanceModule(definition)` shall provide `forRoot`, `forRootAsync`, `token(name)`, `Inject(name)`, `Driver(name)` and `Registry`, with driver names private to each instance module (source README "Instance modules"; ADR 0084 decision 1 instance-module pattern for driver packages).
- **FR-046**: `Container.create` shall accept `overrides` and `moduleOverrides`, applied before planning, so diagnostics describe the overridden graph.
- **FR-047**: The container shall emit typed `ContainerEvent`s to `ContainerOptions.logger` (default `silentLogger`) and to `subscribe` listeners, and `container.emit({ type: "custom", … })` shall freeze the event and force `type: "custom"`.

**Hosts and testing**

- **FR-050**: `./testing` shall provide `Test.createTestingModule`, `overrideProvider()`, `overrideModule()` and `createMockContainer`.
- **FR-051**: `./react` and `./native` shall provide `ContainerProvider`, `ScopeProvider`, the hooks, `resetScopes`, `createContainerHmr` and (native) `bindAppState`; `./node` shall provide `enableShutdownHooks` and `createScopeStorage`; `./devtools` shall provide `registerContainerDevtools` and the payload shapes (ADR 0084 decision 1: a devtools tab only where needed, X4).
- **FR-052**: The core entry shall read no host global (`process`, `window`) and import no React; host-specific code shall live only in its host entry.
- **FR-053**: The package shall not import `encore.dev`, `@nestjs/*` or `reflect-metadata` (ADR 0011; ADR 0084 decision 1; `boundaries.jsonc`).

**Port conventions (ADR 0084 decision 1, ADR 0006, ADR 0007)**

- **FR-060**: Every file shall carry a Stackra file-contract docblock and every export a docblock (ADR 0007), replacing the source's "Figentra file contract" header and ADR-0007/ADR-0017/ADR-0030 references with the Stackra ADR numbers.
- **FR-061**: The code shall keep one export per file, `#` subpath imports, and no `any`, non-null assertions or TypeScript `enum` declarations (ADR 0006); the source's `src/contracts/enums/scope.enum.ts` stays a string-literal union or `as const` object.
- **FR-062**: Every test shall sit in a `__tests__/` folder beside its subject (ADR 0022); the source's 94 test and fixture files shall be ported with them, including the React host e2e test [NEEDS CLARIFICATION: TS2 — recommended: a, filename infixes such as `.e2e.test.tsx` with matching turbo tasks].
- **FR-063**: The package shall meet the coverage floor of the common definition of done [NEEDS CLARIFICATION: TS3 — recommended: a, 80% lines and functions and 70% branches; the container is not on the 90/80 list].

### Key Entities

- **Token**: an identity for a provider: a class, or a `defineToken<T>(name)` object; built-in tokens are listed in FR-040.
- **Provider declaration**: `useClass`, `useValue`, `useFactory` or `useExisting`, with scope and `lazy`.
- **Module**: a decorated class or dynamic module with `imports`, `providers`, `exports` and registered collections.
- **Module graph**: the output of `scan`: modules by reference, globals, BFS distance.
- **Plan**: the output of `plan`: bound dependencies, bubbled scopes, deterministic order, diagnostics.
- **Container / ScopeContainer**: the runtime executing a plan; a scope owns scoped and transient instances it builds.
- **Diagnostic**: a coded `STK` message from the `@stackra/contracts` catalogue.
- **Instance module**: named instances of one contract, each built by a named driver.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All ported tests (94 test and fixture files in the source) pass under `pnpm verify` with names changed only.
- **SC-002**: Zero occurrences of `FCN` codes, `@figentra-os` or `Reflect.defineMetadata`/`Reflect.getMetadata` in the package; every emitted code matches `^STK\d{4}$`.
- **SC-003**: Planning a fixture graph whose every constructor throws completes with zero constructor calls.
- **SC-004**: Two plans of the same graph serialise byte-identically in 100 consecutive runs.
- **SC-005**: A service built by the Encore toolchain (esbuild) with legacy decorators boots a container and resolves an injected provider, matching the spike STA-6 result (ADR 0042 D6; ADR 0091 D9).
- **SC-006**: The package installs with exactly one runtime dependency, `@stackra/contracts`.
- **SC-007**: Coverage meets the floor answered by TS3.

## Assumptions

- The Encore plus legacy-decorator spike passed (STA-6, roadmap "Already done"; ADR 0091 D9), which satisfies ADR 0042 D6 and the "after the spike" condition of ADR 0084 and Round 8 F3. ADR 0042 and ADR 0084 are still Proposed; this spec relies on them under OR1 a as the roadmap assumes (OR1 is a Phase 0 item, STA-134).
- **Lane discrepancy**: the roadmap lists this row as lite, citing 0084 (only adapt, redesign and fresh rows need a spec). ADR 0120 D4 allows lite only at R0–R1, and a new package is R2 (D16). Risk can be raised, never lowered, so this spec takes the full lane. No questionnaire question covers it.
- **Dependency discrepancy**: the roadmap lists "contracts, support" as dependencies. The source imports only `@figentra-os/contracts`, and ADR 0005 D4 says the container core never imports the support package, so support is an ordering dependency of the wave, not a package dependency.
- `@stackra/contracts` (STA-74) lands first with the container's diagnostics renamed to `STK` in its catalogue.
- Code numbers keep their source digits (`FCN1001` becomes `STK1001`) unless the contracts spec allocates per-package ranges; that allocation belongs to STA-74.
- Behaviour is unchanged; the only additions are `createParamDecorator` and a `createDecorator` export at the core root (FR-014).

## Glossary

- **Legacy decorators**: TypeScript `experimentalDecorators`, the declaration standard of ADR 0005.
- **WeakMap metadata store**: the container's replacement for `reflect-metadata`; a class's metadata dies with the class.
- **Scan / plan / instantiate**: the three phases; only the third creates objects.
- **Creators**: `createDecorator` and `createParamDecorator`, the functions a package uses to define its own decorators (ADR 0117 C2).
- **Root module**: the module a member names in `package.json` under `"stackra": { "module": … }` (ADR 0090 D1).
- **STK**: the Stackra diagnostics code prefix, replacing Figentra OS's `FCN` (ADR 0084 decision 1, X3).
- **Instance module**: the ADR 0017-era pattern for driver packages: `forRoot` with named instances built by named drivers.
- **Lane / change risk**: ADR 0120's process tracks (full, lite, bug, chore) and code-change risk scale (R0–R3).

## Open items

- [NEEDS CLARIFICATION: FW1 — recommended: a, entries first (`contracts`, `core`, `node`, `react`, `native`, `testing`, `devtools` here), `config/` and `resources/` outside `src`, superseding 0004] (FR-002)
- [NEEDS CLARIFICATION: TS2 — recommended: a, filename infixes `.int`, `.contract`, `.e2e` with turbo tasks `test:int`, `test:contract`, `test:e2e`] (FR-062)
- [NEEDS CLARIFICATION: TS3 — recommended: a, 80% lines and functions and 70% branches for this package] (FR-063, SC-007)
