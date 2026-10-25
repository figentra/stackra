/**
 * Stackra file contract:
 * Purpose: unit tests of `TrayClickAction`: its codes in source order, a case read by name, and the type of one code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16: the Enum row).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { TrayClickAction } from "#core/enums/tray-click-action.enum";

describe("TrayClickAction", () => {
  it("lists its codes in source order", () => {
    expect(Enum.values(TrayClickAction)).toEqual(["toggle_main", "open_menu"]);
  });

  it("reads a case by name and types it as a code", () => {
    expect(TrayClickAction.ToggleMain).toBe("toggle_main");
    expectTypeOf(TrayClickAction.ToggleMain).toEqualTypeOf<"toggle_main">();
    expectTypeOf<TrayClickAction>().toEqualTypeOf<"toggle_main" | "open_menu">();
  });

  it("is frozen", () => {
    expect(Object.isFrozen(TrayClickAction)).toBe(true);
  });
});
