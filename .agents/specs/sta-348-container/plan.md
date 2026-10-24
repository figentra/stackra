# Plan: `@stackra/container` wave 1b

**Spec**: `.agents/specs/sta-348-container/spec.md`

## Design

- Kind registry: `KIND_RECORDS` (a WeakMap, internal) written by `registerKind`, read by `kindOf`, which walks the
  constructor chain. `createKind` returns a function usable as `extends K` and `extends K(options)`; `Module` is built
  with it. `Service` and `Explorer` are bare abstract classes registered with `registerKind`. `Driver(Port)` returns a
  fresh subclass of the port, registered with its port.
- `createDecorator({ kind, target, kinds })`: the decorator is its own key; it records into WeakMaps and refuses a
  wrong target or kind. `Lifetime` (facet plus codes via `Enum.of`) and `Replaces` are made with it.
- `Container`: merges wirings (later wins), loads drivers (override, test choice, `selectedBy`, only candidate),
  builds singletons eagerly, runs Explorers, `forRequest()`, `close()`. `Clock` defaults to an internal
  `SystemClockDriver`; `DiscoveryService` is built by the container.
- `./react`: `ContainerProvider` and `useContainer` over a context.
- `./testing`: `TestingModuleBuilder` (`override`, `useDrivers`, `onCompile`, `compile`), `TestingApp`,
  `registerWiring` and `registerTestingPlugin`, the extension point other packages use by declaration merging.

## Constitution check

- Boundaries: runtime imports `@stackra/contracts` only; React is an optional peer; `./react` and `./testing` import
  `.` through `#core/*`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; no `define*` outside config; no `Guard`, `Provider` (except the React context component), `scope`.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).
