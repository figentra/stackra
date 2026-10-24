/**
 * Stackra file contract:
 * Purpose: tests of `createTestingModule` in the shapes the template's tests call it: a module bound by config, a
 *          port put in place with `.override`, `.useDrivers(name | map)`, a boot that rejects with
 *          `UnresolvedPortError` when the host's port has no driver, `{ imports: [...] }` with a fixture module whose
 *          exports an Explorer discovers, and `app.get`, `app.has`, `app.modules` and `app.close`.
 * Boundary: test only; the wirings are hand-written in the shape gen writes and registered as gen's vitest setup does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0263 (decision 12).
 */
import { Port } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import {
  createDecorator,
  DiscoveryService,
  Driver,
  Explorer,
  Module,
  Service,
  UnresolvedPortError,
  type Wiring,
} from "#core/index";
import { REGISTERED_WIRINGS } from "#testing/constants/registered-wirings.constant";
import { createTestingModule } from "#testing/functions/create-testing-module.function";
import { registerWiring } from "#testing/functions/register-wiring.function";
import { TestingApp } from "#testing/services/testing-app.service";

abstract class LoyaltyLedger extends Port {
  abstract balance(member: string): number;
}

abstract class LoyaltyMembers extends Port {
  abstract isMember(member: string): boolean;
}

class MemoryLoyaltyLedgerDriver extends Driver(LoyaltyLedger) {
  balance(): number {
    return 0;
  }
}

class PostgresLoyaltyLedgerDriver extends Driver(LoyaltyLedger) {
  balance(): number {
    return 1;
  }
}

class HostLedger extends LoyaltyLedger {
  balance(): number {
    return 2;
  }
}

class MembersFake extends LoyaltyMembers {
  isMember(): boolean {
    return true;
  }
}

class LoyaltyKitConfig {
  ledger = "postgres";
}

class LoyaltyService extends Service {
  readonly ledger: LoyaltyLedger;

  constructor(ledger: LoyaltyLedger, _members: LoyaltyMembers) {
    super();
    this.ledger = ledger;
  }
}

class LoyaltyKitModule extends Module({ exports: [LoyaltyService] }) {}

const loyaltyKit: Wiring = {
  member: "loyalty_kit",
  root: LoyaltyKitModule,
  modules: {
    loyalty_kit: { exports: [LoyaltyService], dependsOn: [] },
    access_log: { exports: [], dependsOn: [], from: "@acme/access-log" },
  },
  bindings: [
    {
      module: "loyalty_kit",
      kind: "service",
      provide: LoyaltyService,
      deps: [LoyaltyLedger, LoyaltyMembers],
    },
  ],
  config: [{ key: "loyalty_kit", provide: LoyaltyKitConfig }],
  drivers: [
    {
      port: LoyaltyLedger,
      key: "loyalty_kit.LoyaltyLedger",
      selectedBy: "config:loyalty_kit.ledger",
      candidates: {
        postgres: () => Promise.resolve(PostgresLoyaltyLedgerDriver),
        memory: () => Promise.resolve(MemoryLoyaltyLedgerDriver),
      },
    },
    { port: LoyaltyMembers, key: "loyalty_kit.LoyaltyMembers", candidates: {} },
  ],
};

beforeEach(() => {
  REGISTERED_WIRINGS.clear();
  registerWiring(loyaltyKit);
});

describe("createTestingModule", () => {
  it("binds the ledger named by config, or the ledger put in its place", async () => {
    const byConfig = await createTestingModule(LoyaltyKitModule)
      .override(LoyaltyKitConfig, Object.assign(new LoyaltyKitConfig(), { ledger: "memory" }))
      .override(LoyaltyMembers, new MembersFake())
      .compile();
    expect(byConfig).toBeInstanceOf(TestingApp);
    expect(byConfig.get(LoyaltyLedger)).toBeInstanceOf(MemoryLoyaltyLedgerDriver);

    const byHost = await createTestingModule(LoyaltyKitModule)
      .override(LoyaltyLedger, new HostLedger())
      .override(LoyaltyMembers, new MembersFake())
      .compile();
    expect(byHost.get(LoyaltyLedger)).toBeInstanceOf(HostLedger);
    expect(byHost.get(LoyaltyService).ledger).toBe(byHost.get(LoyaltyLedger));
  });

  it("picks drivers by name or per port ahead of config", async () => {
    const byName = await createTestingModule(LoyaltyKitModule)
      .useDrivers("memory")
      .override(LoyaltyMembers, new MembersFake())
      .compile();
    expect(byName.get(LoyaltyLedger)).toBeInstanceOf(MemoryLoyaltyLedgerDriver);

    const byMap = await createTestingModule(LoyaltyKitModule)
      .useDrivers("memory")
      .useDrivers({ loyalty_kit: "postgres" })
      .override(LoyaltyMembers, new MembersFake())
      .compile();
    expect(byMap.get(LoyaltyLedger)).toBeInstanceOf(PostgresLoyaltyLedgerDriver);
  });

  it("fails to compile without a driver for the host's port", async () => {
    await expect(
      createTestingModule(LoyaltyKitModule).useDrivers("memory").compile(),
    ).rejects.toThrow(UnresolvedPortError);
  });

  it("lists the root's own modules, answers has, and closes", async () => {
    const app = await createTestingModule(LoyaltyKitModule)
      .override(LoyaltyMembers, new MembersFake())
      .compile();
    expect(app.modules.map((module) => module.key)).toEqual(["loyalty_kit"]);
    expect(app.modules[0]?.type).toBe(LoyaltyKitModule);
    expect(app.has(LoyaltyService)).toBe(true);
    expect(app.has(LoyaltyMembers)).toBe(true);
    await expect(app.close()).resolves.toBeUndefined();
  });

  it("boots modules imported together, building a fixture module's exports for an Explorer", async () => {
    const Logged = createDecorator<string>({ kind: "logged", target: "class", kinds: ["service"] });

    @Logged("personal")
    class CustomerReads extends Service {}

    class FixtureModule extends Module({ exports: [CustomerReads] }) {}

    class LogExplorer extends Explorer {
      targets: string[] = [];

      private readonly discovery: DiscoveryService;

      constructor(discovery: DiscoveryService) {
        super();
        this.discovery = discovery;
      }

      onApplicationBootstrap(): void {
        this.targets = this.discovery.classesWith(Logged).map((found) => found.className);
      }
    }

    class LogModule extends Module {}

    registerWiring({
      member: "log",
      root: LogModule,
      modules: { log: { exports: [], dependsOn: [] } },
      bindings: [
        { module: "log", kind: "explorer", provide: LogExplorer, deps: [DiscoveryService] },
      ],
    });

    const app = await createTestingModule({ imports: [LogModule, FixtureModule] })
      .override(LoyaltyMembers, new MembersFake())
      .compile();
    expect(app.get(LogExplorer).targets).toEqual(["CustomerReads"]);
    expect(app.modules.map((module) => [module.key, module.type])).toEqual([
      ["log", LogModule],
      ["fixture", FixtureModule],
    ]);
  });
});
