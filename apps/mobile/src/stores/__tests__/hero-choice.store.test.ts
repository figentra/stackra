/**
 * Stackra file contract:
 * Purpose: proves `heroChoice` picks the hero after the remembered one, keeps it for the launch, remembers it, switches
 *          to a known hero (telling its subscribers) and ignores an unknown one.
 * Boundary: the store alone; react-native-mmkv is absent, so `displayPrefs` keeps values in memory.
 * Runtime: node
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes); ADR 0022 (test placement).
 */
import { describe, expect, it, vi } from "vitest";

import { displayPrefs } from "../display-prefs.store";
import { heroChoice } from "../hero-choice.store";

describe("heroChoice", () => {
  it("shows the hero after the last one, keeps it, and switches only to a known hero", () => {
    displayPrefs.set("hero", "stack");
    expect(heroChoice.getSnapshot()).toBe("storm");
    expect(heroChoice.getSnapshot()).toBe("storm");
    expect(displayPrefs.get("hero")).toBe("storm");

    const listener = vi.fn();
    const stop = heroChoice.subscribe(listener);
    heroChoice.set("nope");
    expect(heroChoice.getSnapshot()).toBe("storm");
    heroChoice.set("mirror");
    expect(heroChoice.getSnapshot()).toBe("mirror");
    expect(displayPrefs.get("hero")).toBe("mirror");
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
  });
});
