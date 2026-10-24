/**
 * Stackra file contract:
 * Purpose: unit tests of `TestingModuleBuilder`: every chain method returns the builder, an override of a named
 *          instance is honoured, `onCompile` steps run in order on the compiled app, a class no wiring names lists as
 *          its own module, and `compile()` never edits the registered wiring.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0263 (decision 12).
 */
import { Port } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Driver, Module, named, Service, type Wiring } from "#core/index";
import { REGISTERED_WIRINGS } from "#testing/constants/registered-wirings.constant";
import { registerWiring } from "#testing/functions/register-wiring.function";
import { TestingModuleBuilder } from "#testing/services/testing-module-builder.service";

abstract class Ledger extends Port {
  abstract balance(): number;
}

class MemoryLedgerDriver extends Driver(Ledger) {
  balance(): number {
    return 0;
  }
}

class Reads extends Service {}

class ReportingModule extends Module({ exports: [Reads] }) {}

const wiring: Wiring = {
  member: "ledger",
  drivers: [{ port: Ledger, candidates: { memory: () => Promise.resolve(MemoryLedgerDriver) } }],
};

beforeEach(() => {
  REGISTERED_WIRINGS.clear();
  registerWiring(wiring);
});

describe("TestingModuleBuilder", () => {
  it("returns itself from every chain method", () => {
    const builder = new TestingModuleBuilder([ReportingModule]);
    expect(builder.override(Ledger, new MemoryLedgerDriver())).toBe(builder);
    expect(builder.useDrivers("memory")).toBe(builder);
    expect(builder.useDrivers({ ledger: "memory" })).toBe(builder);
    expect(builder.onCompile(() => undefined)).toBe(builder);
  });

  it("honours an override of a named instance", async () => {
    const primary = new MemoryLedgerDriver();
    const app = await new TestingModuleBuilder([ReportingModule])
      .override(named(Ledger, "primary"), primary)
      .compile();
    expect(app.get(named(Ledger, "primary"))).toBe(primary);
    expect(app.get(Ledger)).not.toBe(primary);
  });

  it("runs onCompile steps in order and lists a class no wiring names as its own module", async () => {
    const order: string[] = [];
    const app = await new TestingModuleBuilder([ReportingModule])
      .onCompile(() => {
        order.push("first");
      })
      .onCompile(async (compiled) => {
        order.push(compiled.has(Reads) ? "second" : "missing");
        await Promise.resolve();
      })
      .compile();
    expect(order).toEqual(["first", "second"]);
    expect(app.modules).toEqual([
      { key: "reporting", type: ReportingModule, exports: [Reads], dependsOn: [] },
    ]);
  });

  it("leaves the registered wiring as it was", async () => {
    await new TestingModuleBuilder([ReportingModule])
      .override(Ledger, new MemoryLedgerDriver())
      .compile();
    expect(REGISTERED_WIRINGS.get("ledger")).toBe(wiring);
    expect(Object.keys(wiring)).toEqual(["member", "drivers"]);
  });
});
