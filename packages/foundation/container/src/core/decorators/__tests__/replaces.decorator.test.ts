/**
 * Stackra file contract:
 * Purpose: unit tests of `@Replaces(Port)`: it records the replaced port on a driver and refuses any other kind.
 * Boundary: test only; the container acts on the wiring's `replaces`, proven in the container's tests.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 6
 *                     and 19).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Driver } from "#core/bases/driver.base";
import { Service } from "#core/bases/service.base";
import { Replaces } from "#core/decorators/replaces.decorator";

abstract class Ledger extends Port {
  abstract balance(): number;
}

@Replaces(Ledger)
class LegacyLedgerDriver extends Driver(Ledger) {
  balance(): number {
    return 0;
  }
}

describe("Replaces", () => {
  it("records the port a driver replaces", () => {
    expect(Replaces.on(LegacyLedgerDriver)).toBe(Ledger);
    expect([Replaces.kind, Replaces.kinds]).toEqual(["replaces", ["driver"]]);
  });

  it("refuses a class that is not a driver", () => {
    expect(() => {
      @Replaces(Ledger)
      class LedgerService extends Service {}
      return LedgerService;
    }).toThrow(/@replaces may mark driver; LedgerService is a service/);
  });
});
