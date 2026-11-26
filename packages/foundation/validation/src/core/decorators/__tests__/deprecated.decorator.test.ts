/**
 * Stackra file contract:
 * Purpose: unit tests of `@Deprecated`: the class form records the deprecation on a kind it may mark (a schema, an
 *          action, a settings group, a service), the field form on a shape's field, both read back through the
 *          ancestors; malformed options and a sunset inside the window throw on import; a method, a class of no kind
 *          and a kind it may not mark are refused.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0131 (decision 4);
 *                     ADR 0177 (decision 6); STA-2836.
 */
import { registerKind } from "@stackra/container";
import type { Deprecation } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { Deprecated } from "#core/decorators/deprecated.decorator";

/** The deprecation the tests record. */
const NEXT_MINOR: Deprecation = { since: "0.34.0", sunset: "0.35.0", replacement: "OrderView" };

@Deprecated(NEXT_MINOR)
class OrderSummary extends Schema {
  @Deprecated({
    since: "0.34.0",
    sunset: "0.35.0",
    replacement: "total",
  })
  amount = 0;

  total = 0;
}

class LegacyOrderSummary extends OrderSummary {
  @Deprecated({
    since: "2026-11-26",
    sunset: "2027-05-26",
  })
  note = "";
}

describe("Deprecated", () => {
  it("records the deprecation of a class, read back on a subclass", () => {
    expect(Deprecated.on(OrderSummary)).toEqual(NEXT_MINOR);
    expect(Deprecated.on(LegacyOrderSummary)).toEqual(NEXT_MINOR);
    expect(Object.isFrozen(Deprecated.on(OrderSummary))).toBe(true);
  });

  it("records the deprecation of each field, the ancestors' first", () => {
    expect([...Deprecated.members(LegacyOrderSummary)]).toEqual([
      ["amount", { since: "0.34.0", sunset: "0.35.0", replacement: "total" }],
      ["note", { since: "2026-11-26", sunset: "2027-05-26" }],
    ]);
  });

  it("marks an action, a settings group and a service", () => {
    for (const kind of ["action", "settings", "service"]) {
      abstract class KindBase {}
      registerKind(KindBase, kind);
      @Deprecated(NEXT_MINOR)
      class Marked extends KindBase {}
      expect(Deprecated.on(Marked)).toEqual(NEXT_MINOR);
    }
  });

  it("throws on malformed options, naming the code", () => {
    expect(() => Deprecated({ since: "soon", sunset: "0.35.0" })).toThrow(
      /^@Deprecated: since "soon" is neither .* \(deprecation_invalid\)$/,
    );
    expect(() => Deprecated({ since: "0.34.0", sunset: "2027-05-26" })).toThrow(
      /deprecation_invalid/,
    );
  });

  it("throws on a sunset inside the window", () => {
    expect(() => Deprecated({ since: "0.34.0", sunset: "0.34.5" })).toThrow(
      /stays until 0\.35\.0 at least .*\(deprecation_window_short\)$/,
    );
    expect(() => Deprecated({ since: "1.2.0", sunset: "1.3.0" })).toThrow(
      /deprecation_window_short/,
    );
  });

  it("refuses a method", () => {
    expect(() => {
      class Wrong extends Schema {
        @Deprecated(NEXT_MINOR)
        total(): number {
          return 0;
        }
      }
      return Wrong;
    }).toThrow(/@deprecated decorates a field, not a method/);
  });

  it("refuses a class of no kind and a kind it may not mark", () => {
    expect(() => {
      @Deprecated(NEXT_MINOR)
      class Plain {}
      return Plain;
    }).toThrow(/@deprecated may mark .*; Plain is of no kind/);
    abstract class DriverBase {}
    registerKind(DriverBase, "driver");
    expect(() => {
      @Deprecated(NEXT_MINOR)
      class MemoryDriver extends DriverBase {}
      return MemoryDriver;
    }).toThrow(/@deprecated may mark .*; MemoryDriver is a driver/);
  });
});
