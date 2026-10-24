# Plan: `@stackra/state` wave 2

**Spec**: `.agents/specs/sta-348-state/spec.md`

## Design

- `Store` is `createKind("store", StoreBase)` cast to `StoreClass & ((options: StoreOptions) => StoreClass)`, as
  `Module` is. The exported interface `Store` extends the local `StoreBase`, so the protected `set` reaches every
  subclass and `useStore(X).set` does not type-check outside it.
- The constructor takes an optional `StoreStorage`. It reads `persist` from `kindOf(new.target)`, opens that area when
  storage is given, resolves the key through `storeKeyOf` (throws when unregistered), records the bookkeeping in the
  `STORE_INTERNALS` weak map and schedules `hydrateStore` on a microtask, after the subclass's initializers.
- `set` takes a record or a function of the store (a mapped type over the polymorphic `this` would refuse object
  literals inside the class), refuses non-fields, records written fields, and calls `commitStore` when something
  changed: version + 1, write the own non-function fields under the key, notify listeners.
- `hydrateStore` reads once; a `Promise` from the area is awaited; saved fields apply only when declared, unwritten and
  of the default's type; listeners are notified when something changed.
- `registerStores` fills `STORE_KEYS` (class to `<member>.<name>`), the call gen's wiring makes.
- `StateOptions` (a `Schema`, registering `STATE_CONFIG_SCHEMA` for itself) and `StateConfig extends Config({ schema:
StateOptions })` follow the logger pattern; the barrel exports the schema as `StateConfig$`.
- `./react`: `signal` returns frozen bound closures; `useSignal` and `useStore` use `useSyncExternalStore`, the store
  through `subscribeStore` and `storeVersion` on the instance `useContainer().get(type)` returns.
- `./testing`: `MemoryStoreStorage` (internal fake, JSON copies), `createStore` (await hydration), `mountStore`
  (synchronous, returns the store's area as `prefs`).

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                           |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/state/state`; workspace imports: `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                            |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                                          |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                                   |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                 |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                         |
| Not built yet (ADR 0227)              | PASS   | no Zustand or TanStack Store; client state is `@stackra/state` (ADR 0079)                                                                                                                      |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                      |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                              |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                             |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                        |

- Boundaries: imports `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`, `zod`,
  `react` only; no storage, app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only. Naming: v3.1; files `<name>.<kind>.ts`; one declaration per file.
- Tests: `src/**/__tests__/` beside each subject; through `@stackra/testing`.

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` names `@stackra/state` at `packages/state/state`, `exports` lists exactly `.`, `./react` and `./testing`, and every version in it is `catalog:` or `workspace:*` — Validates: FR-001
- **P-002**: `.` exports `Store`, `StateConfig`, `StateConfig$`, `registerStores` and the types `StoreClass`, `StoreOptions`, `StorePatch`, `StoreStorage` and `StoreStorageArea`, and nothing else — Validates: FR-002
- **P-003**: `./react` exports `signal`, `useSignal`, `useStore` and the type `Signal`, `./testing` exports `createStore`, `mountStore` and the type `MountedStore`, and no symbol is exported from two entries — Validates: FR-003
- **P-004**: no file imports `@stackra/storage`, and any object whose `area(name)` returns `{ get(key), set(key, value) }` satisfies `StoreStorage` structurally — Validates: FR-004
- **P-005**: every source file opens with a file-contract docblock, and every exported symbol has a docblock — Validates: FR-005
