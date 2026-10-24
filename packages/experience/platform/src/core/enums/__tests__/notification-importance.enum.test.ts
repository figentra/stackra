/**
 * Stackra file contract:
 * Purpose: unit tests of `NotificationImportance`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { NotificationImportance } from "#core/enums/notification-importance.enum";

describe("NotificationImportance", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(NotificationImportance)).toEqual(["min", "low", "default", "high", "max"]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(NotificationImportance.Min).toBe("min");
    expectTypeOf(NotificationImportance.Min).toEqualTypeOf<"min">();
    expectTypeOf<NotificationImportance>().toEqualTypeOf<
      "min" | "low" | "default" | "high" | "max"
    >();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(NotificationImportance)).toBe(true);
  });
});
