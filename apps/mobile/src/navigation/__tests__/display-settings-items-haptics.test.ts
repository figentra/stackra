/**
 * Stackra file contract:
 * Purpose: proves the native display switcher adds the haptics switch, checked by its state and flipping it, only
 *          when the navigator hands it that state.
 * Boundary: the item description alone; no navigator or native module loads.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 6); ADR 0022 (test placement).
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

describe("displaySettingsItems haptics", () => {
  it("adds the haptics switch only with its state, and flips it", () => {
    const [plain] = displaySettingsItems(STATE);
    if (plain?.type !== "menu") throw new Error("expected a menu item");
    expect(plain.menu.items).toHaveLength(2);

    const setEnabled = vi.fn();
    const [item] = displaySettingsItems(STATE, undefined, { isEnabled: true, setEnabled });
    if (item?.type !== "menu") throw new Error("expected a menu item");
    const haptics = item.menu.items[2];
    if (haptics?.type !== "action") throw new Error("expected the haptics action");
    expect(haptics.state).toBe("on");
    haptics.onPress();
    expect(setEnabled).toHaveBeenCalledWith(false);
  });
});
