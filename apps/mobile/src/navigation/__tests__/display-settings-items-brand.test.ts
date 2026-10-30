/**
 * Stackra file contract:
 * Purpose: proves the native display switcher adds the brand submenu only when the navigator hands it the brands,
 *          checks the current brand and picks the pressed one.
 * Boundary: the item description alone; no navigator or native module loads.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 6); ADR 0340 (decision 2); ADR 0022 (test placement).
 */
import { describe, expect, it, vi } from "vitest";

import { displaySettingsItems } from "../display-settings-items.function";

const STATE = {
  colorScheme: "light",
  resolvedColorScheme: "light",
  locale: "en",
  setColorScheme: vi.fn(),
  setLocale: vi.fn(),
} as const;

describe("displaySettingsItems brand", () => {
  it("adds the brand submenu with the current brand checked, and picks one", () => {
    const onSelect = vi.fn();
    const [item] = displaySettingsItems(STATE, undefined, undefined, {
      items: [
        { id: "figentra", label: "Figentra" },
        { id: "organza", label: "Organza" },
      ],
      current: "figentra",
      onSelect,
    });
    if (item?.type !== "menu") throw new Error("expected a menu item");
    expect(item.menu.items).toHaveLength(3);
    const brands = item.menu.items[2];
    if (brands?.type !== "submenu") throw new Error("expected the brand submenu");
    expect(brands.items.map((brand) => brand.type === "action" && brand.state)).toEqual([
      "on",
      "off",
    ]);
    const organza = brands.items[1];
    if (organza?.type !== "action") throw new Error("expected an action");
    organza.onPress();
    expect(onSelect).toHaveBeenCalledWith("organza");
  });
});
