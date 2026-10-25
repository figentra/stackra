/**
 * Stackra file contract:
 * Purpose: unit tests of `OverlayStyle`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { OverlayStyle } from "#core/enums/overlay-style.enum";

describe("OverlayStyle", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(OverlayStyle)).toEqual(["launcher", "panel"]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(OverlayStyle.Launcher).toBe("launcher");
    expectTypeOf(OverlayStyle.Launcher).toEqualTypeOf<"launcher">();
    expectTypeOf<OverlayStyle>().toEqualTypeOf<"launcher" | "panel">();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(OverlayStyle)).toBe(true);
  });
});
