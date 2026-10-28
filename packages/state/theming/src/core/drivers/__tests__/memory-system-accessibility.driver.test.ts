/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySystemAccessibilityDriver`: a driver of `SystemAccessibility` that starts at the
 *          defaults, replaces a frozen snapshot on `set` and notifies only on a real change, until unsubscribed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DEFAULT_ACCESSIBILITY_SETTINGS, SystemAccessibility } from "#contracts/index";
import { MemorySystemAccessibilityDriver } from "#core/drivers/memory-system-accessibility.driver";

describe("MemorySystemAccessibilityDriver", () => {
  it("is a driver of SystemAccessibility that starts at the defaults", () => {
    const driver = new MemorySystemAccessibilityDriver();
    expect(driver).toBeInstanceOf(SystemAccessibility);
    expect(kindOf(MemorySystemAccessibilityDriver)).toEqual({
      kind: "driver",
      options: { port: SystemAccessibility },
    });
    expect(driver.current()).toBe(DEFAULT_ACCESSIBILITY_SETTINGS);
  });

  it("replaces a frozen snapshot and notifies only on a real change", () => {
    const driver = new MemorySystemAccessibilityDriver();
    const listener = vi.fn();
    const stop = driver.subscribe(listener);
    driver.set({ reduceMotion: true, fontScale: 1.5 });
    const changed = driver.current();
    expect(changed).toEqual({
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      reduceMotion: true,
      fontScale: 1.5,
    });
    expect(Object.isFrozen(changed)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    driver.set({ reduceMotion: true });
    expect(driver.current()).toBe(changed);
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    driver.set({ boldText: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
