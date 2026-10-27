/**
 * Stackra file contract:
 * Purpose: unit tests of `WindowKind`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { WindowKind } from "#core/enums/window-kind.enum";

describe("WindowKind", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(WindowKind)).toEqual(["normal", "utility", "kiosk"]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(WindowKind.Normal).toBe("normal");
    expectTypeOf(WindowKind.Normal).toEqualTypeOf<"normal">();
    expectTypeOf<WindowKind>().toEqualTypeOf<"normal" | "utility" | "kiosk">();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(WindowKind)).toBe(true);
  });
});
