/**
 * Stackra file contract:
 * Purpose: unit tests of `Container`: it builds bindings from a generated-style wiring table with no reflect-metadata,
 *          selects drivers by override, test choice, config or single candidate, fails a boot without a driver with
 *          `UnresolvedPortError`, resolves named instances, honours the three lifetimes, replaces, merges wirings,
 *          boots only the chosen roots eagerly, runs Explorers once and shuts instances down on close.
 * Boundary: test only; the wirings are written by hand in the shape gen writes, and the config classes are plain
 *           classes (the Config kind belongs to @stackra/config).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (decisions 1,
 *                     5, 9, 11 and 12); ADR 0294 (decision 17).
 */
import { Clock, Port } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Driver } from "#core/bases/driver.base";
import { Explorer } from "#core/bases/explorer.base";
import { Module } from "#core/bases/module.base";
import { Service } from "#core/bases/service.base";
import { Lifetime } from "#core/decorators/lifetime.decorator";
import { SystemClockDriver } from "#core/drivers/system-clock.driver";
import { UnresolvedPortError } from "#core/errors/unresolved-port.error";
import { named } from "#core/functions/named.function";
import { Container } from "#core/services/container.service";
import { DiscoveryService } from "#core/services/discovery.service";
import type { Wiring } from "#core/types/wiring.type";

abstract class Ledger extends Port {
  abstract balance(): number;
}

class MemoryLedgerDriver extends Driver(Ledger) {
  balance(): number {
    return 1;
  }
}

class PostgresLedgerDriver extends Driver(Ledger) {
  balance(): number {
    return 2;
  }
}

class CustomLedgerDriver extends Driver(Ledger) {
  balance(): number {
    return 3;
  }
}

abstract class Members extends Port {
  abstract isMember(id: string): boolean;
}

class PointsConfig {
  ledger = "memory";

  ledgers: Record<string, string> = {};
}

class HostPointsConfig extends PointsConfig {
  override ledger = "postgres";
}

class PointsService extends Service {
  static built = 0;

  readonly ledger: Ledger;

  readonly config: PointsConfig;

  constructor(ledger: Ledger, config: PointsConfig) {
    super();
    PointsService.built += 1;
    this.ledger = ledger;
    this.config = config;
  }
}

class PointsModule extends Module({ exports: [PointsService] }) {}

/** A wiring of the shape gen writes for a package with one port, one config class and one service. */
const points = (extra: Partial<Wiring> = {}): Wiring => ({
  member: "points",
  root: PointsModule,
  modules: { points: { exports: [PointsService], dependsOn: [] } },
  bindings: [
    {
      module: "points",
      kind: "service",
      provide: PointsService,
      lifetime: Lifetime.Singleton,
      deps: [Ledger, PointsConfig],
    },
  ],
  config: [{ key: "points", provide: PointsConfig }],
  drivers: [
    {
      port: Ledger,
      key: "points.Ledger",
      selectedBy: "config:points.ledger",
      named: "config:points.ledgers",
      candidates: {
        memory: () => Promise.resolve(MemoryLedgerDriver),
        postgres: () => Promise.resolve(PostgresLedgerDriver),
      },
    },
  ],
  ...extra,
});

beforeEach(() => {
  PointsService.built = 0;
});

describe("Container", () => {
  describe("building from the wiring table", () => {
    it("injects the constructor tokens the wiring lists, with no reflect-metadata", async () => {
      expect((Reflect as unknown as Record<string, unknown>)["getMetadata"]).toBeUndefined();
      const container = await Container.create([points()]);
      const service = container.get(PointsService);
      expect(service).toBeInstanceOf(PointsService);
      expect(service.ledger).toBeInstanceOf(MemoryLedgerDriver);
      expect(service.ledger).toBeInstanceOf(Ledger);
      expect(service.config).toBeInstanceOf(PointsConfig);
      expect(service.config.ledger).toBe("memory"); // the field initializer survives super()
    });

    it("keeps one instance of a singleton and builds it at boot", async () => {
      const container = await Container.create([points()]);
      expect(PointsService.built).toBe(1);
      expect(container.get(PointsService)).toBe(container.get(PointsService));
      expect(container.get(Ledger)).toBe(container.get(PointsService).ledger);
    });

    it("fails on a dependency cycle", async () => {
      class First extends Service {}
      class Second extends Service {}
      const wiring: Wiring = {
        member: "cycle",
        bindings: [
          { module: "cycle", provide: First, deps: [Second] },
          { module: "cycle", provide: Second, deps: [First] },
        ],
      };
      await expect(Container.create([wiring])).rejects.toThrow(
        /Dependency cycle: First -> Second -> First/,
      );
    });

    it("refuses a class nothing binds", async () => {
      class Unbound extends Service {}
      const container = await Container.create([points()]);
      expect(() => container.get(Unbound)).toThrow(/Nothing binds Unbound/);
    });
  });

  describe("selecting drivers", () => {
    it("takes the driver config names, and the host override of the config class", async () => {
      const container = await Container.create([
        points({ config: [{ key: "points", provide: PointsConfig, override: HostPointsConfig }] }),
      ]);
      expect(container.get(Ledger)).toBeInstanceOf(PostgresLedgerDriver);
      expect(container.get(PointsConfig)).toBeInstanceOf(HostPointsConfig);
      expect(container.get(HostPointsConfig)).toBe(container.get(PointsConfig));
    });

    it("lets an override win and never loads the port's drivers", async () => {
      const memory = vi.fn(() => Promise.resolve(MemoryLedgerDriver));
      const custom = new CustomLedgerDriver();
      const wiring = points({
        drivers: [{ port: Ledger, selectedBy: "config:points.ledger", candidates: { memory } }],
      });
      const container = await Container.create([wiring], {
        overrides: new Map([[Ledger, custom]]),
      });
      expect(container.get(Ledger)).toBe(custom);
      expect(container.get(PointsService).ledger).toBe(custom);
      expect(memory).not.toHaveBeenCalled();
    });

    it("reads the driver from a config instance passed as an override", async () => {
      const config = Object.assign(new PointsConfig(), { ledger: "postgres" });
      const container = await Container.create([points()], {
        overrides: new Map([[PointsConfig, config]]),
      });
      expect(container.get(Ledger)).toBeInstanceOf(PostgresLedgerDriver);
      expect(container.get(PointsConfig)).toBe(config);
    });

    it("lets a driver choice win over config: by port key, member, class name or fallback", async () => {
      const byKey = await Container.create([points()], {
        drivers: { byPort: { "points.Ledger": "postgres" } },
      });
      const byMember = await Container.create([points()], {
        drivers: { byPort: { points: "postgres" } },
      });
      const byClass = await Container.create([points()], {
        drivers: { byPort: { Ledger: "postgres" } },
      });
      const fallback = await Container.create([points()], { drivers: { fallback: "postgres" } });
      for (const container of [byKey, byMember, byClass, fallback])
        expect(container.get(Ledger)).toBeInstanceOf(PostgresLedgerDriver);
    });

    it("skips a fallback or member choice the port has no driver of, but refuses an exact one", async () => {
      const skipped = await Container.create([points()], {
        drivers: { fallback: "redis", byPort: { points: "redis" } },
      });
      expect(skipped.get(Ledger)).toBeInstanceOf(MemoryLedgerDriver);
      await expect(
        Container.create([points()], { drivers: { byPort: { "points.Ledger": "redis" } } }),
      ).rejects.toThrow(UnresolvedPortError);
    });

    it("takes the only candidate of a port with no selector", async () => {
      const wiring = points({
        drivers: [
          { port: Ledger, candidates: { postgres: () => Promise.resolve(PostgresLedgerDriver) } },
        ],
      });
      const container = await Container.create([wiring]);
      expect(container.get(Ledger)).toBeInstanceOf(PostgresLedgerDriver);
    });

    it("refuses a config value that names no driver", async () => {
      const config = Object.assign(new PointsConfig(), { ledger: "redis" });
      await expect(
        Container.create([points()], { overrides: new Map([[PointsConfig, config]]) }),
      ).rejects.toThrow(/config:points.ledger is "redis", but its drivers are memory, postgres/);
    });

    it("binds a replacement in place of the port's drivers", async () => {
      const memory = vi.fn(() => Promise.resolve(MemoryLedgerDriver));
      const wiring = points({
        drivers: [{ port: Ledger, candidates: { memory } }],
        replaces: [{ provide: Ledger, override: CustomLedgerDriver }],
      });
      const container = await Container.create([wiring]);
      expect(container.get(Ledger)).toBeInstanceOf(CustomLedgerDriver);
      expect(memory).not.toHaveBeenCalled();
    });

    it("answers for the selected driver class with the port's instance", async () => {
      const container = await Container.create([points()]);
      expect(container.get(MemoryLedgerDriver)).toBe(container.get(Ledger));
    });
  });

  describe("unresolved ports", () => {
    it("fails the boot with UnresolvedPortError, a plain Error, when a port has no candidate", async () => {
      const wiring = points({
        drivers: [...(points().drivers ?? []), { port: Members, candidates: {} }],
      });
      const failure = await Container.create([wiring]).catch((error: unknown) => error);
      expect(failure).toBeInstanceOf(UnresolvedPortError);
      expect(failure).toBeInstanceOf(Error);
      expect((failure as UnresolvedPortError).port).toBe(Members);
      expect((failure as UnresolvedPortError).name).toBe("UnresolvedPortError");
    });

    it("boots when an override fills the port", async () => {
      const wiring = points({
        drivers: [...(points().drivers ?? []), { port: Members, candidates: {} }],
      });
      const members = new (class extends Members {
        isMember(): boolean {
          return true;
        }
      })();
      const container = await Container.create([wiring], {
        overrides: new Map([[Members, members]]),
      });
      expect(container.get(Members)).toBe(members);
    });

    it("fails when a binding needs a port no wiring drives", async () => {
      class NeedsMembers extends Service {}
      const wiring = points({
        bindings: [{ module: "points", provide: NeedsMembers, deps: [Members] }],
      });
      await expect(Container.create([wiring])).rejects.toThrow(UnresolvedPortError);
    });

    it("merges candidates a host adds for a dependency's port", async () => {
      class HostMembersDriver extends Driver(Members) {
        isMember(): boolean {
          return true;
        }
      }
      const kit = points({
        drivers: [...(points().drivers ?? []), { port: Members, candidates: {} }],
      });
      const host: Wiring = {
        member: "host",
        drivers: [
          { port: Members, candidates: { host: () => Promise.resolve(HostMembersDriver) } },
        ],
      };
      const container = await Container.create([kit, host]);
      expect(container.get(Members)).toBeInstanceOf(HostMembersDriver);
    });
  });

  describe("named instances", () => {
    it("builds the instance config names, apart from the default one", async () => {
      const config = Object.assign(new PointsConfig(), { ledgers: { primary: "postgres" } });
      const container = await Container.create([points()], {
        overrides: new Map([[PointsConfig, config]]),
      });
      const primary = container.get(named(Ledger, "primary"));
      expect(primary).toBeInstanceOf(PostgresLedgerDriver);
      expect(container.get(Ledger)).toBeInstanceOf(MemoryLedgerDriver);
      expect(container.get(named(Ledger, "primary"))).toBe(primary);
    });

    it("gives the default instance for a name config does not declare", async () => {
      const container = await Container.create([points()]);
      expect(container.get(named(Ledger, "primary"))).toBe(container.get(Ledger));
    });

    it("refuses a named instance whose driver does not exist", async () => {
      const config = Object.assign(new PointsConfig(), { ledgers: { primary: "redis" } });
      await expect(
        Container.create([points()], { overrides: new Map([[PointsConfig, config]]) }),
      ).rejects.toThrow(UnresolvedPortError);
    });
  });

  describe("lifetimes", () => {
    @Lifetime(Lifetime.Request)
    class Cart extends Service {}

    class Stamp extends Service {}

    const wiring = points({
      bindings: [
        ...(points().bindings ?? []),
        { module: "points", provide: Cart, deps: [] },
        { module: "points", provide: Stamp, lifetime: Lifetime.Transient, deps: [] },
      ],
    });

    it("keeps a request instance per request container and refuses it on the root", async () => {
      const container = await Container.create([wiring]);
      expect(() => container.get(Cart)).toThrow(/Lifetime.Request/);
      const first = container.forRequest();
      const second = container.forRequest();
      expect(first.get(Cart)).toBe(first.get(Cart));
      expect(first.get(Cart)).not.toBe(second.get(Cart));
    });

    it("shares singletons with every request container", async () => {
      const container = await Container.create([wiring]);
      expect(container.forRequest().get(PointsService)).toBe(container.get(PointsService));
    });

    it("builds a transient instance on every resolution", async () => {
      const container = await Container.create([wiring]);
      expect(container.get(Stamp)).not.toBe(container.get(Stamp));
    });
  });

  describe("built-ins", () => {
    it("binds Clock to the system driver unless something else binds it", async () => {
      const container = await Container.create([points()]);
      expect(container.get(Clock)).toBeInstanceOf(SystemClockDriver);
      const fixed = new (class extends Clock {
        now(): Date {
          return new Date(0);
        }
      })();
      const frozen = await Container.create([points()], { overrides: new Map([[Clock, fixed]]) });
      expect(frozen.get(Clock).now()).toEqual(new Date(0));
    });

    it("binds DiscoveryService once per container", async () => {
      const container = await Container.create([points()]);
      expect(container.get(DiscoveryService)).toBeInstanceOf(DiscoveryService);
      expect(container.get(DiscoveryService)).toBe(container.get(DiscoveryService));
    });
  });

  describe("has", () => {
    it("is true for what the container binds and false otherwise", async () => {
      class Unbound extends Service {}
      const container = await Container.create([points()]);
      expect(container.has(PointsService)).toBe(true);
      expect(container.has(Ledger)).toBe(true);
      expect(container.has(PointsConfig)).toBe(true);
      expect(container.has(Clock)).toBe(true);
      expect(container.has(named(Ledger, "primary"))).toBe(true);
      expect(container.has(Members)).toBe(false);
      expect(container.has(Unbound)).toBe(false);
    });
  });

  describe("roots", () => {
    class AuditService extends Service {
      static built = 0;

      constructor() {
        super();
        AuditService.built += 1;
      }
    }

    class AuditModule extends Module({ exports: [AuditService] }) {}

    const audit: Wiring = {
      member: "audit",
      root: AuditModule,
      modules: { audit: { exports: [AuditService], dependsOn: [] } },
      bindings: [{ module: "audit", kind: "service", provide: AuditService, deps: [] }],
    };

    beforeEach(() => {
      AuditService.built = 0;
    });

    it("builds the bindings of the chosen roots at boot and the others on demand", async () => {
      const container = await Container.create([points(), audit], { roots: [PointsModule] });
      expect(PointsService.built).toBe(1);
      expect(AuditService.built).toBe(0);
      expect(container.get(AuditService)).toBeInstanceOf(AuditService);
      expect(AuditService.built).toBe(1);
    });

    it("builds every wiring's bindings when no root is chosen", async () => {
      await Container.create([points(), audit]);
      expect(AuditService.built).toBe(1);
    });

    it("builds what a booted module file exports even with no wiring row", async () => {
      class Reads extends Service {}
      class FixtureModule extends Module({ exports: [Reads] }) {}
      const container = await Container.create([], { roots: [FixtureModule] });
      expect(container.instances()).toContainEqual(expect.any(Reads));
      expect(container.get(Reads)).toBe(container.instances()[0]);
    });
  });

  describe("lifecycle", () => {
    it("runs each Explorer once, after the bindings are built", async () => {
      const seen: unknown[] = [];
      class PointsExplorer extends Explorer {
        readonly points: PointsService;

        constructor(service: PointsService) {
          super();
          this.points = service;
        }

        onApplicationBootstrap(): void {
          seen.push(this.points.ledger.balance());
        }
      }
      const wiring = points({
        bindings: [
          ...(points().bindings ?? []),
          { module: "points", kind: "explorer", provide: PointsExplorer, deps: [PointsService] },
        ],
      });
      const container = await Container.create([wiring]);
      container.get(PointsExplorer);
      expect(seen).toEqual([1]);
    });

    it("shuts built instances down last first, and leaves overrides alone", async () => {
      const order: string[] = [];
      class First extends Service {
        onApplicationShutdown(): void {
          order.push("first");
        }
      }
      class Second extends Service {
        onApplicationShutdown(): Promise<void> {
          order.push("second");
          return Promise.resolve();
        }
      }
      const given = new (class extends Service {
        onApplicationShutdown(): void {
          order.push("override");
        }
      })();
      class Given extends Service {}
      const wiring: Wiring = {
        member: "life",
        bindings: [
          { module: "life", provide: First, deps: [] },
          { module: "life", provide: Second, deps: [First, Given] },
        ],
      };
      const container = await Container.create([wiring], { overrides: new Map([[Given, given]]) });
      await container.close();
      expect(order).toEqual(["second", "first"]);
      expect(container.instances()).toEqual([]);
    });
  });
});
