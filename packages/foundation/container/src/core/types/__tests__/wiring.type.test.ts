/**
 * Stackra file contract:
 * Purpose: type tests of `Wiring` and its parts: a wiring of the shape the template's committed loyalty-kit and web
 *          samples carry satisfies it (named deps, lazy driver candidates, config overrides, string roots and the
 *          sections other packages own), while a string token, a lifetime outside the three and a binding without its
 *          class are refused; the container boots it.
 * Boundary: test only; the classes are test-local stand-ins for the template's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (decision 11).
 */
import { Clock, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Driver } from "#core/bases/driver.base";
import { Module } from "#core/bases/module.base";
import { Service } from "#core/bases/service.base";
import { Lifetime } from "#core/decorators/lifetime.decorator";
import { named } from "#core/functions/named.function";
import { Container } from "#core/services/container.service";
import type { Wiring } from "#core/types/wiring.type";
import type { WiringBinding } from "#core/types/wiring-binding.type";

abstract class LoyaltyLedger extends Port {
  abstract balance(member: string): Promise<number>;
}

abstract class LoyaltyMembers extends Port {
  abstract isMember(member: string): Promise<boolean>;
}

class MemoryLoyaltyLedgerDriver extends Driver(LoyaltyLedger) {
  async balance(): Promise<number> {
    return 0;
  }
}

class HostLoyaltyMembersDriver extends Driver(LoyaltyMembers) {
  async isMember(): Promise<boolean> {
    return true;
  }
}

class LoyaltyKitOptions {
  ledger = "memory";
}

class LoyaltyKitConfig {
  ledger = "memory";

  ledgers: Record<string, string> = {};
}

class HostLoyaltyKitConfig extends LoyaltyKitConfig {}

class LoyaltyService extends Service {}

class LedgerReconcilerService extends Service {}

class LoyaltyKitModule extends Module({ exports: [LoyaltyService, LedgerReconcilerService] }) {}

class DemoSeeder {}

const wiring = {
  member: "loyalty_kit",
  package: "@acme/loyalty-kit",
  root: LoyaltyKitModule,
  modules: {
    loyalty_kit: { exports: [LoyaltyService, LedgerReconcilerService], dependsOn: [] },
    access_log: { exports: [], dependsOn: [], from: "@acme/access-log" },
  },
  platform: [Clock],
  bindings: [
    {
      module: "loyalty_kit",
      kind: "service",
      provide: LoyaltyService,
      lifetime: Lifetime.Singleton,
      deps: [LoyaltyLedger, LoyaltyMembers, LoyaltyKitConfig],
    },
    {
      module: "loyalty_kit",
      kind: "service",
      provide: LedgerReconcilerService,
      lifetime: Lifetime.Singleton,
      deps: [named(LoyaltyLedger, "primary"), LoyaltyLedger],
    },
  ],
  partners: [{ class: LoyaltyService, model: "loyalty_kit.loyalty_account" }],
  extensionPoints: [],
  config: [
    {
      key: "loyalty_kit",
      provide: LoyaltyKitConfig,
      override: HostLoyaltyKitConfig,
      schema: LoyaltyKitOptions,
      env: { ledger: "STACKRA_LOYALTY_KIT_LEDGER" },
    },
  ],
  drivers: [
    {
      port: LoyaltyLedger,
      selectedBy: "config:loyalty_kit.ledger",
      named: "config:loyalty_kit.ledgers",
      candidates: { memory: () => Promise.resolve(MemoryLoyaltyLedgerDriver) },
    },
    {
      port: LoyaltyMembers,
      candidates: { host: () => Promise.resolve(HostLoyaltyMembersDriver) },
      deps: { host: [] },
    },
  ],
  seeders: { "loyalty_kit.demo": () => Promise.resolve(DemoSeeder) },
  replaces: [],
  checks: { cycles: "none" },
} satisfies Wiring;

describe("Wiring", () => {
  it("accepts a wiring of the shape gen writes, and the container boots it", async () => {
    const container = await Container.create([wiring]);
    expect(container.get(LoyaltyService)).toBeInstanceOf(LoyaltyService);
    expect(container.get(LoyaltyKitConfig)).toBeInstanceOf(HostLoyaltyKitConfig);
    expect(container.get(LoyaltyMembers)).toBeInstanceOf(HostLoyaltyMembersDriver);
  });

  it("accepts an app wiring whose root is a module key", () => {
    const app = {
      member: "@acme/web",
      root: "web",
      modules: { web: { exports: [], dependsOn: ["i18n"] } },
      bindings: [{ module: "web", provide: LoyaltyService, kind: "route", deps: [] }],
      contexts: ["i18n"],
      links: [],
    } satisfies Wiring;
    expect(app.root).toBe("web");
  });

  it("refuses a string token, an unknown lifetime and a binding without its class", () => {
    const stringToken: WiringBinding = {
      module: "m",
      provide: LoyaltyService,
      // @ts-expect-error -- strings are never tokens
      deps: ["LoyaltyLedger"],
    };
    const badLifetime: WiringBinding = {
      module: "m",
      provide: LoyaltyService,
      // @ts-expect-error -- "forever" is not a lifetime
      lifetime: "forever",
    };
    // @ts-expect-error -- a binding names its class
    const noClass: WiringBinding = { module: "m", deps: [] };
    expect([stringToken, badLifetime, noClass]).toHaveLength(3);
  });
});
