/**
 * Stackra file contract:
 * Purpose: unit tests of `MenuItemKind`: its codes in order, the ones the template's site header switches on included.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0128 (`Enum.of`).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MenuItemKind } from "#core/enums/menu-item-kind.enum";

describe("MenuItemKind", () => {
  it("lists the kinds of menu entry", () => {
    expect(Enum.values(MenuItemKind)).toEqual([
      "route",
      "link",
      "group",
      "action",
      "shortcut",
      "separator",
      "navigation",
      "tabs",
    ]);
    expect([MenuItemKind.Route, MenuItemKind.Link, MenuItemKind.Group]).toEqual([
      "route",
      "link",
      "group",
    ]);
  });
});
