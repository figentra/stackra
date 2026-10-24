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

## Constitution check

- Boundaries: imports `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`, `zod`,
  `react` only; no storage, app, service or `encore.dev`.
- Versions: catalogs and `workspace:*` only. Naming: v3.1; files `<name>.<kind>.ts`; one declaration per file.
- Tests: `src/**/__tests__/` beside each subject; through `@stackra/testing`.
