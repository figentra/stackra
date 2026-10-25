/**
 * Stackra file contract:
 * Purpose: unit tests of `MenuKind`: the places a menu is shown, as the template's menus name them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0128 (`Enum.of`).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MenuKind } from "#core/enums/menu-kind.enum";

describe("MenuKind", () => {
  it("lists the places a menu is shown", () => {
    expect(Enum.values(MenuKind)).toEqual(["navigation", "tab_bar", "context", "app", "tray"]);
    expect(MenuKind.TabBar).toBe("tab_bar");
  });
});
