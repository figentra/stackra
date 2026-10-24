# Feature Specification: `@stackra/state` wave 2, the Store kind, signals and persisted client state

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: resolved (registry v3.1 row: entries `.`, `./react`, `./testing`, depends on config; ADR
0127 2026-10-24 note places it at `packages/state/state`; ADR 0079 as amended by 0294: `Store({ persist })` kind base,
no `@Store` decorator, no `StoreBase` export)

**Input**: Build `@stackra/state` (state, wave 2) for real: the `Store({ persist })` kind base, persisted and
session-only stores, signals, `useStore`/`useSignal`, `StateConfig` with its shipped schema, and the test helpers.

## Impact

- **Apps touched**: none (the template's console, mobile and web apps consume it; STA-344)
- **Services touched**: none
- **Packages touched**: `packages/state/state` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none; no tables. Client state only; nothing server-owned is copied into a store (ADR 0079 d2)
- **Secrets**: none
- **ADR needed**: no (ADR 0079, 0256, 0294 decisions 15, 16, 19, 20 and 25; ADR 0127 2026-10-24 note)
- **New dependencies**: none new; `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`
  through `workspace:*`; `zod` through `catalog:`; React, Testing Library and jsdom through `catalog:frontend` (dev and
  optional peer)
- **Deploy modes**: same in all; no network
- **Lane**: full (a new package)
- **Change risk**: R2 (persisted client preferences; a wrong key or an overwrite loses a user's choice)

## User Scenarios & Testing

### User Story 1 - Declare a store and change it through its methods (Priority: P1)

An app writes `class PaletteStore extends Store { isOpen = false; open() { this.set({ isOpen: true }); } }`. The
fields are the state, `set` is the only writer, getters are derived.

**Independent Test**: `src/core/bases/__tests__/store.base.test.ts`.

**Acceptance Scenarios**:

1. **Given** `extends Store` or `extends Store({ persist })`, **Then** the instance is a `Store` and `kindOf` reads kind
   `store` with the options.
2. **Given** `this.set({ field })` or `this.set((s) => ({ ... }))`, **Then** the fields change and subscribers are
   notified once; a patch that changes nothing notifies nobody.
3. **Given** a patch naming a method or an unknown name, **Then** `set` throws a `TypeError`.
4. **Given** a component, **Then** `set` is not callable from outside the class (protected).

### User Story 2 - Persist a store under its derived key (Priority: P1)

`UiStore extends Store({ persist: StorageArea.Prefs })` is written to the `prefs` area under `console.ui` on every
change and read back on the next launch.

**Independent Test**: `src/core/functions/__tests__/hydrate-store.function.test.ts`,
`src/testing/functions/__tests__/create-store.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a registered key, **Then** each change writes the whole state (own non-function fields) under it.
2. **Given** a saved state, **Then** hydration applies the declared fields of the same type after the field
   initializers, once, synchronously for a synchronous driver and through a promise for an asynchronous one.
3. **Given** a field `set` wrote before hydration finished, **Then** hydration never overwrites it.
4. **Given** a persisted store with no registered key and storage, **Then** construction throws naming the class and the
   fix; without storage it lives in memory.

### User Story 3 - Read stores and signals in React (Priority: P1)

**Independent Test**: `src/react/store/__tests__/use-store.test.tsx`, `src/react/signal/__tests__/use-signal.test.tsx`.

**Acceptance Scenarios**:

1. **Given** `useStore(UiStore)` under a `ContainerProvider`, **Then** it returns the bound instance and re-renders after
   every change and after hydration; it throws outside a provider or for an unbound class.
2. **Given** a module-level `signal(null)`, **Then** every `useSignal` reader re-renders after `set`; equal values are
   silent; a read-only `{ get, subscribe }` view is accepted.

### User Story 4 - Configure and test client state (Priority: P2)

**Independent Test**: `src/config/__tests__/state.config.test.ts`,
`src/testing/functions/__tests__/mount-store.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `StateConfig`, **Then** its key is `state`, its defaults equal `StateConfig$.parse({})`, and the template's
   override (`persistStore: StorageArea`, `blockingHydration = true`) builds.
2. **Given** `mountStore(UiStore)`, **Then** it returns `{ store, prefs }` synchronously and `prefs.get("console.ui")`
   holds the density as its code.

## Requirements

- **FR-001**: The member is `@stackra/state` at `packages/state/state`, `tier:lib`, entries `.`, `./react`, `./testing`
  only, versions from catalogs and `workspace:*` only.
- **FR-002**: `.` exports `Store`, `StateConfig`, `StateConfig$`, `registerStores` and the types `StoreClass`,
  `StoreOptions`, `StorePatch`, `StoreStorage`, `StoreStorageArea`; nothing else.
- **FR-003**: `./react` exports `signal`, `useSignal`, `useStore` and the type `Signal`; `./testing` exports
  `createStore`, `mountStore` and the type `MountedStore`. No symbol from two entries.
- **FR-004**: The package never imports `@stackra/storage`; storage satisfies `StoreStorage` structurally
  (`area(name)` returning `{ get(key), set(key, value) }`).
- **FR-005**: Every file carries a file-contract docblock and every exported symbol a docblock.

## Success Criteria

- **SC-001**: Every symbol the template imports exists with the shape it uses: `Store` (bare and
  `Store({ persist: StorageArea.Prefs })`, protected `set` with object and function patches), `StateConfig` (overridable
  `persistStore`, `blockingHydration`, `devtoolsInProduction`), `StateConfig$` (`.shape.persistStore.unwrap()`),
  `signal`, `useSignal`, `useStore`, `createStore(Class, { storage })` returning a promise, `mountStore(Class)`
  returning `{ store, prefs }` with `prefs.get(key)`.
- **SC-002**: Tests beside every public symbol pass in the separate testing workflow; type tests compile.
- **SC-003**: Registry v3.1 row satisfied: `.` StateConfig, StateConfig$, Store; `./react` signal, useSignal, useStore;
  `./testing` createStore, mountStore.

## Assumptions and follow-ups

- Gen (`#stackra/wiring`) calls `registerStores([[Class, key], ...])` from the manifest's `stores` section, as it calls
  `registerSchemas` for shapes; until it does, the template's store tests need a registration in their setup.
- `@stackra/storage` (W5) ships a `Storage` whose `area(name)` matches `StoreStorageArea`; its `fakeStorage()` is what
  the template passes to `createStore`.
- Hydration checks a saved field against the default's type only; it moves to the store's generated `X$` once gen
  registers store schemas.
