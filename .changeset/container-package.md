---
"@stackra/container": minor
---

Add `@stackra/container`, the DI container and kind machinery of the programming model v3.1: the kind bases `Module`
(both forms), `Service`, `Explorer` and `Driver(Port)`; `Lifetime` (codes and facet) and `@Replaces`; `Named<Port, "x">`
with `named()`; `DriverName<Port>` over the `DriverRegistry` gen augments; `Container`, which boots generated wirings
with no reflect-metadata, selects drivers by override, test choice, config or single candidate, and fails a boot without
a driver with `UnresolvedPortError` (a plain `Error`); `DiscoveryService` and `createDecorator` (record-only decorators
refused outside their kinds); `createKind`, `registerKind`, `kindOf` and `WithPartner` for kind packages; `./react`
with `ContainerProvider` and `useContainer`; and `./testing` with `createTestingModule` (`.override`, `.useDrivers`,
`.compile`, `TestingApp`), `registerWiring` and the `registerTestingPlugin` extension point.
