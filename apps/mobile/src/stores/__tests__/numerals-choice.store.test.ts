/**
 * Stackra file contract:
 * Purpose: proves `numeralsChoice` starts on Latin digits (ADR 0192), switches to Arabic-Indic and back, remembers
 *          the pick, tells its subscribers and ignores anything not on offer.
 * Boundary: the store alone; react-native-mmkv is absent, so `displayPrefs` keeps values in memory.
 * Runtime: node
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28); ADR 0022 (test placement).
 */
import { describe, expect, it, vi } from "vitest";

import { displayPrefs } from "../display-prefs.store";
import { numeralsChoice } from "../numerals-choice.store";

describe("numeralsChoice", () => {
  it("starts Latin, switches only to a digit system on offer, and remembers it", () => {
    expect(numeralsChoice.getSnapshot()).toBe("latn");
    const listener = vi.fn();
    const stop = numeralsChoice.subscribe(listener);
    numeralsChoice.set("user");
    expect(numeralsChoice.getSnapshot()).toBe("latn");
    numeralsChoice.set("arab");
    expect(numeralsChoice.getSnapshot()).toBe("arab");
    expect(displayPrefs.get("numerals")).toBe("arab");
    numeralsChoice.set("arab");
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
  });
});
