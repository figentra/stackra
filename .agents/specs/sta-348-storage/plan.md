# Plan: `@stackra/storage` wave 2

**Spec**: `.agents/specs/sta-348-storage/spec.md`

## Design

- `./contracts`: `Storage extends Port` with six abstract area properties named by the `StorageArea` codes, plus
  `store(type)`, `hydrate()`, `flush()`. The leaf imports no other entry, so it names areas as properties instead of
  importing the enum; a type test pins `StorageArea` to `keyof Storage`.
- `createStorageArea(backend?)` is the one area implementation: a `Map` of envelope text (`{"v":...,"e"?:...}`),
  synchronous reads and writes, expiry checked on read with `Date.now()`, `read`/`write` through `validate` from
  `@stackra/validation` and the key from `registerStorageKeys`. A synchronous backend loads at once, an asynchronous one
  on `hydrate()`; writes queue on one promise chain and a failure is kept for the next `flush()`.
- `AreaStorageDriver` (internal, abstract) builds the six areas from a backend map and routes `store(type)`;
  `MemoryStorageDriver` passes none; `WebStorageDriver` (`./browser`) passes prefixed `localStorage`/`sessionStorage`
  backends for `prefs`, `cache`, `session`.
- `usePrefs()` resolves `Storage` from `useContainer()`; `fakeStorage()` returns a new `MemoryStorageDriver`.

## Constitution check

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/container`, `@stackra/validation` only; React is an
  optional peer; `./contracts` is a leaf; `./browser`, `./react`, `./testing` import `.`/`./contracts` through aliases.
- Versions: catalogs and `workspace:*` only. No ORM (ADR 0014, 0256 d6).
- Naming: v3.1; files `<name>.<kind>.ts`; enum codes snake_case; no parameter properties, no `#private` fields.
