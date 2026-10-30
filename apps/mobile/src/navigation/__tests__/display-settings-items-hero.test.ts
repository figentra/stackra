/**
 * Stackra file contract:
 * Purpose: proves the native display switcher adds the landing hero submenu only when the navigator hands it the
 *          heroes, checks the current hero and picks the pressed one.
 * Boundary: the item description alone; no navigator or native module loads.
 * Runtime: node
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes); ADR 0022 (test placement).
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

describe("displaySettingsItems hero", () => {
  it("adds the hero submenu with the current hero checked, and picks one", () => {
    const onSelect = vi.fn();
    const [item] = displaySettingsItems(STATE, undefined, undefined, undefined, {
      label: "Landing hero",
      items: [
        { id: "stack", label: "The stack" },
        { id: "mirror", label: "English and Arabic" },
      ],
      current: "stack",
      onSelect,
    });
    if (item?.type !== "menu") throw new Error("expected a menu item");
    const heroes = item.menu.items[2];
    if (heroes?.type !== "submenu") throw new Error("expected the hero submenu");
    expect(heroes.label).toBe("Landing hero");
    expect(heroes.items.map((hero) => hero.type === "action" && hero.state)).toEqual(["on", "off"]);
    const mirror = heroes.items[1];
    if (mirror?.type !== "action") throw new Error("expected an action");
    mirror.onPress();
    expect(onSelect).toHaveBeenCalledWith("mirror");
  });
});
