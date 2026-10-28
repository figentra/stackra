/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Driver(Port)`: the driver is an instance of its port, the kind registry records
 *          the port, each call gives its own class, constructor injection runs through `super()`, and a driver that
 *          leaves out one of the port's abstract members does not compile.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16
 *                     and 25); ADR 0305 (rule 8).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Driver } from "#core/bases/driver.base";
import { kindOf } from "#core/functions/kind-of.function";
import type { DriverClass } from "#core/types/driver-class.type";

abstract class Ledger extends Port {
  abstract balance(member: string): Promise<number>;
}

class Journal {
  readonly entries = new Map<string, number>([["usr_1", 40]]);
}

class JournalLedgerDriver extends Driver(Ledger) {
  private readonly journal: Journal;

  constructor(journal: Journal) {
    super();
    this.journal = journal;
  }

  async balance(member: string): Promise<number> {
    return this.journal.entries.get(member) ?? 0;
  }
}

describe("Driver", () => {
  it("makes a class whose instances are the port", async () => {
    const driver = new JournalLedgerDriver(new Journal());
    expect(driver).toBeInstanceOf(Ledger);
    expect(driver).toBeInstanceOf(Port);
    expect(await driver.balance("usr_1")).toBe(40);
  });

  it("records the driver kind and its port", () => {
    expect(kindOf(JournalLedgerDriver)).toEqual({ kind: "driver", options: { port: Ledger } });
  });

  it("records its options with the kind, for gen's internal and test-default rules", () => {
    const Base = Driver(Ledger, { internal: true, testDefault: false });
    expect(kindOf(Base)).toEqual({
      kind: "driver",
      options: { internal: true, testDefault: false, port: Ledger },
    });
  });

  it("gives each call its own base class", () => {
    expect(Driver(Ledger)).not.toBe(Driver(Ledger));
    expect(Driver(Ledger).name).toBe("LedgerDriver");
  });

  it("types the base as the port and makes the driver implement its abstract members", () => {
    expectTypeOf<InstanceType<DriverClass<typeof Ledger>>>().toEqualTypeOf<Ledger>();
    // @ts-expect-error -- balance is abstract on the port and this driver does not implement it
    class IncompleteDriver extends Driver(Ledger) {}
    expect(IncompleteDriver).toBeTypeOf("function");
  });
});
