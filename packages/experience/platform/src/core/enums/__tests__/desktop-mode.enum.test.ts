/**
 * Stackra file contract:
 * Purpose: unit tests of `DesktopMode`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DesktopMode } from "#core/enums/desktop-mode.enum";

describe("DesktopMode", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(DesktopMode)).toEqual(["window", "tray", "hybrid"]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(DesktopMode.Window).toBe("window");
    expectTypeOf(DesktopMode.Window).toEqualTypeOf<"window">();
    expectTypeOf<DesktopMode>().toEqualTypeOf<"window" | "tray" | "hybrid">();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(DesktopMode)).toBe(true);
  });
});
