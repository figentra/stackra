/**
 * Stackra file contract:
 * Purpose: unit tests of `OverlayAnchor`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { OverlayAnchor } from "#core/enums/overlay-anchor.enum";

describe("OverlayAnchor", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(OverlayAnchor)).toEqual([
      "screen_center",
      "tray_icon",
      "edge_right",
      "edge_left",
      "cursor",
    ]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(OverlayAnchor.ScreenCenter).toBe("screen_center");
    expectTypeOf(OverlayAnchor.ScreenCenter).toEqualTypeOf<"screen_center">();
    expectTypeOf<OverlayAnchor>().toEqualTypeOf<
      "screen_center" | "tray_icon" | "edge_right" | "edge_left" | "cursor"
    >();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(OverlayAnchor)).toBe(true);
  });
});
