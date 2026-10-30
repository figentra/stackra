/**
 * Stackra file contract:
 * Purpose: proves the native display switcher shows the resolved scheme's symbol, checks the picked scheme and locale,
 *          calls the setters from its menu actions, and labels itself with the translator it is given.
 * Boundary: the item description alone; no navigator or native module loads.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 6); ADR 0022 (test placement).
 */
import { describe, expect, it, vi } from "vitest";

import { displaySettingsItems } from "../display-settings-items.function";

describe("displaySettingsItems", () => {
  it("describes one stable menu item that reflects and changes the display state", () => {
    const setColorScheme = vi.fn();
    const setLocale = vi.fn();
    const [item] = displaySettingsItems({
      colorScheme: "system",
      resolvedColorScheme: "dark",
      locale: "ar",
      setColorScheme,
      setLocale,
    });
    if (item?.type !== "menu") throw new Error("expected a menu item");
    expect(item.identifier).toBe("display-settings");
    expect(item.icon).toEqual({ type: "sfSymbol", name: "moon" });
    const [schemes, languages] = item.menu.items;
    if (schemes?.type !== "submenu" || languages?.type !== "submenu")
      throw new Error("expected submenus");
    expect(schemes.items.map((action) => action.type === "action" && action.state)).toEqual([
      "off",
      "off",
      "on",
    ]);
    expect(languages.items.map((action) => action.type === "action" && action.state)).toEqual([
      "off",
      "on",
    ]);
    const light = schemes.items[0];
    if (light?.type === "action") light.onPress();
    expect(setColorScheme).toHaveBeenCalledWith("light");
  });

  it("labels the menu with the translator it is given, English without one", () => {
    const state = {
      colorScheme: "light",
      resolvedColorScheme: "light",
      locale: "en",
      setColorScheme: vi.fn(),
      setLocale: vi.fn(),
    } as const;
    expect((displaySettingsItems(state)[0] as { label?: string })?.label).toBe("Display settings");
    expect((displaySettingsItems(state, (key) => `[${key}]`)[0] as { label?: string })?.label).toBe(
      "[shell::open]",
    );
  });
});
