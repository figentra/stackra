# @stackra/container

The Stackra DI container and kind machinery. Classes are the only tokens; `stackra gen` reads constructor parameter
types at build time and writes the wiring; the container reads that wiring and never touches reflect-metadata.

**Tier:** `tier:lib` (`packages/foundation/container`). Entries `.`, `./react` and `./testing`. Depends on
`@stackra/contracts` only; React is an optional peer of `./react`.

## What is here

| Entry       | Symbol                                                                         | Use                                                                       |
| ----------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `.`         | `Module`                                                                       | `extends Module` or `extends Module({ exports, imports })`                |
| `.`         | `Service`, `Explorer`                                                          | bare kind bases; an Explorer runs `onApplicationBootstrap()` once at boot |
| `.`         | `Driver(Port)`                                                                 | `class MemoryLedgerDriver extends Driver(LoyaltyLedger) { ... }`          |
| `.`         | `Lifetime`                                                                     | the codes `Lifetime.Singleton`, `.Request`, `.Transient` and the facet    |
| `.`         | `Replaces`                                                                     | `@Replaces(Port)` on a custom driver                                      |
| `.`         | `Named<Port, "x">`, `named(Port, "x")`                                         | a named instance of a port, as a parameter type and as a wiring token     |
| `.`         | `DriverName<Port>`, `DriverRegistry`                                           | a config field that picks a driver; the registry gen augments             |
| `.`         | `Container`, `Wiring`, `UnresolvedPortError`                                   | the container, the generated wiring's shape, the boot failure             |
| `.`         | `DiscoveryService`, `createDecorator`                                          | decorators that only record, and the lookup an Explorer uses              |
| `.`         | `createKind`, `registerKind`, `kindOf`, `WithPartner`                          | for kind packages: kind bases and partner type arguments                  |
| `./react`   | `ContainerProvider`, `useContainer`                                            | the container under a React tree                                          |
| `./testing` | `createTestingModule`, `TestingApp`, `registerWiring`, `registerTestingPlugin` | the testing module and its extension point                                |

## Kinds

```ts
import { Driver, Module, Service } from "@stackra/container";

export class LoyaltyService extends Service {
  constructor(ledger: LoyaltyLedger) {
    super();
    this.ledger = ledger;
  }
}

export class MemoryLoyaltyLedgerDriver extends Driver(LoyaltyLedger) {
  async balance(member: MemberId): Promise<number> { ... }
}

export class LoyaltyKitModule extends Module({ exports: [LoyaltyService] }) {}
```

A kind package builds its own bases with `createKind` (both forms or called only) or `registerKind` (bare only). The
word `define` is reserved for the four `stackra.config.ts` functions, so the helper is `createKind`.

## Decorators

```ts
export const AccessLogged = createDecorator<AccessLoggedOptions>({
  kind: "access_logged",
  target: "class",
  kinds: ["action", "query", "service"],
});

// in the package's explorer
for (const { instance, className, options } of this.discovery.classesWith(AccessLogged)) { ... }
```

A decorator records its value under itself and nothing else. On a target or a kind it was not made for, it throws at
class definition.

## The container

`Container.create(wirings, { roots, overrides, drivers })` merges the wirings (dependencies first), loads each port's
driver (an override, then a test's choice, then the config field `selectedBy` names, then the only candidate), builds
the singletons of the booted modules, and runs each Explorer once. A port nothing binds fails the boot with
`UnresolvedPortError`, a plain `Error`. `forRequest()` gives a container that keeps `Lifetime.Request` instances;
`close()` calls `onApplicationShutdown()` on what it built. `Clock` defaults to a system driver.

## Testing

```ts
import { createTestingModule } from "@stackra/container/testing";

const app = await createTestingModule(LoyaltyKitModule)
  .override(LoyaltyMembers, LoyaltyMembersFake.with([]))
  .useDrivers("memory")
  .compile();
app.get(LoyaltyService);
await app.close();
```

Gen's vitest setup calls `registerWiring` for the member and its dependencies. Other packages add chain methods
(`.withConfig`, `.seed`, `.as`) and app members (`app.events`) with `registerTestingPlugin`, declaring them on
`TestingModuleBuilder` and `TestingApp` by declaration merging.

## Decisions

ADR 0263 (gen writes the wiring), ADR 0294 (decisions 6, 16, 17 and 25), ADR 0305 (rules 2, 3, 8 and 42 to 46),
ADR 0269 (the testing module lives here), the 2026-10-24 notes on ADR 0127 (Module and Service here, Port in
contracts) and ADR 0227 (build-time wiring allowed, runtime reflection rejected).
