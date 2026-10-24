/**
 * Stackra file contract:
 * Purpose: unit tests of `InstallMoment`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { InstallMoment } from "#core/enums/install-moment.enum";

describe("InstallMoment", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(InstallMoment)).toEqual(["quit", "immediately", "prompt"]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(InstallMoment.Quit).toBe("quit");
    expectTypeOf(InstallMoment.Quit).toEqualTypeOf<"quit">();
    expectTypeOf<InstallMoment>().toEqualTypeOf<"quit" | "immediately" | "prompt">();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(InstallMoment)).toBe(true);
  });
});
