# @stackra/container

<!--
Stackra file contract:
Purpose: the reader guide of @stackra/container: the kinds, decorators, the container, extension points
         (multi-binding) and the testing module.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0263; ADR 0294; ADR 0305; ADR 0269; ADR 0457.
-->

The Stackra DI container and kind machinery. Classes are the only tokens; `stackra gen` reads constructor parameter
types at build time and writes the wiring; the container reads that wiring and never touches reflect-metadata.

**Tier:** `tier:lib` (`packages/foundation/container`). Entries `.`, `./devtools`, `./react` and `./testing`. Depends on
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
| `.`         | `container.getAll(Base)`, `discovery.getAll(Base)`                             | the multi-binding: every booted subclass of an extension point's base     |
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

## Extension points (multi-binding)

A module that owns an extension point declares an abstract base; every module that contributes binds a subclass, and
the owner reads them all with `getAll`. No string or array token, no wiring section: the base class is the token.

```ts
// carts
export abstract class CheckoutGuard extends Service {
  abstract check(cart: Cart): Promise<CheckoutVerdict>;
}

export class CheckoutService extends Service {
  constructor(discovery: DiscoveryService) { ... }
  async verdicts(cart: Cart) {
    return Promise.all(this.discovery.getAll(CheckoutGuard).map((guard) => guard.check(cart)));
  }
}

// b2b, which imports carts
export class CreditLimitGuard extends CheckoutGuard { ... }
```

`getAll(Base)` lists the classes the booted modules bind or export that extend `Base` (never `Base` itself), in wiring
order: dependencies first, the host last. Overrides and `@Replaces` apply; a `Lifetime.Request` contribution needs a
`forRequest()` container (`DiscoveryService` reads the root one). ADR 0457.

## Devtools

`Container.bindings()` lists what the container can build, by name and read-only, for tooling: one row per booted
binding, exported class, loaded driver (and named instance) and config class, as `{ token, scope, lifetime,
implementation }`. `scope` is the module key that binds it (a port's driver config key for a driver), `implementation`
the class actually built (the selected driver, the replacement, the config override). It never returns or builds an
instance.

`@stackra/container/devtools` is the dev-only entry (ADR 0246 decision 4):

| Symbol                                         | Use                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| `defineContainerDevtools(kit, container)`      | defines the `container.bindings` tab; returns its remover                         |
| `DevtoolsTabSink`, `DevtoolsTabSinkDefinition` | the kit's `defineTab` by shape; `DevtoolsKit` fits, every devtools entry takes it |

```ts
import { defineContainerDevtools } from "@stackra/container/devtools";

defineContainerDevtools(container.get(DevtoolsKit), container); // the dev bootstrap only
```

The Pro panel (`@stackra-pro/devtools`) lists the tab through the kit's host session; the data stays free (ADR 0461).

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

ADR 0263 (gen writes the wiring), ADR 0294 (decisions 6, 16, 17 and 25), ADR 0457 (multi-binding), ADR 0305 (rules 2, 3, 8 and 42 to 46),
ADR 0269 (the testing module lives here), the 2026-10-24 notes on ADR 0127 (Module and Service here, Port in
contracts) and ADR 0227 (build-time wiring allowed, runtime reflection rejected).
