/**
 * Stackra file contract:
 * Purpose: unit tests of `AccessibilityInfoSystemAccessibilityDriver`: it starts from the device's font scale, reads
 *          Reduce Motion, Bold Text and high contrast (high-contrast text or Darker Colors) on the first subscription,
 *          reads again on each setting or dimensions change, notifies only on a real change, keeps the last answer when
 *          a read fails, and stops watching after the last listener leaves.
 * Boundary: test only; react-native is mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0302 (decision 3, 2026-10-29 note).
 */
import { kindOf } from "@stackra/container";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SystemAccessibility } from "#contracts/index";
import { AccessibilityInfoSystemAccessibilityDriver } from "#native/drivers/accessibility-info-system-accessibility.driver";

const device = vi.hoisted(() => {
  const listeners = new Map<string, Set<() => void>>();
  const on = (event: string, listener: () => void) => {
    listeners.set(event, (listeners.get(event) ?? new Set()).add(listener));
    return { remove: () => listeners.get(event)?.delete(listener) };
  };
  const state = {
    listeners,
    reduceMotion: false,
    boldText: false,
    highTextContrast: false,
    darkerColors: false,
    fontScale: 1,
    fail: false,
  };
  const answer = (value: () => boolean) => () =>
    state.fail ? Promise.reject(new Error("unavailable")) : Promise.resolve(value());
  return {
    state,
    module: {
      AccessibilityInfo: {
        addEventListener: on,
        isReduceMotionEnabled: answer(() => state.reduceMotion),
        isBoldTextEnabled: answer(() => state.boldText),
        isHighTextContrastEnabled: answer(() => state.highTextContrast),
        isDarkerSystemColorsEnabled: answer(() => state.darkerColors),
      },
      Dimensions: { addEventListener: on },
      PixelRatio: { getFontScale: () => state.fontScale },
    },
  };
});

vi.mock("react-native", () => device.module);

const { state } = device;

/** Fires every listener of `event`. */
function emit(event: string): void {
  for (const listener of state.listeners.get(event) ?? []) listener();
}

/** Lets the pending reads settle. */
const settle = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

beforeEach(() => {
  Object.assign(state, {
    reduceMotion: false,
    boldText: false,
    highTextContrast: false,
    darkerColors: false,
    fontScale: 1,
    fail: false,
  });
  state.listeners.clear();
});

describe("AccessibilityInfoSystemAccessibilityDriver", () => {
  it("is a driver of SystemAccessibility that starts from the device's font scale", () => {
    state.fontScale = 1.4;
    const driver = new AccessibilityInfoSystemAccessibilityDriver();
    expect(driver).toBeInstanceOf(SystemAccessibility);
    expect(kindOf(AccessibilityInfoSystemAccessibilityDriver)).toEqual({
      kind: "driver",
      options: { port: SystemAccessibility },
    });
    expect(driver.current()).toEqual({
      reduceMotion: false,
      boldText: false,
      highContrast: false,
      fontScale: 1.4,
    });
  });

  it("reads the settings on the first subscription and again on each change", async () => {
    const driver = new AccessibilityInfoSystemAccessibilityDriver();
    state.reduceMotion = true;
    state.boldText = true;
    const listener = vi.fn();
    driver.subscribe(listener);
    await settle();
    expect(driver.current()).toEqual({
      reduceMotion: true,
      boldText: true,
      highContrast: false,
      fontScale: 1,
    });
    expect(listener).toHaveBeenCalledTimes(1);

    state.darkerColors = true;
    emit("darkerSystemColorsChanged");
    await settle();
    expect(driver.current().highContrast).toBe(true);

    state.fontScale = 2;
    emit("change");
    await settle();
    expect(driver.current().fontScale).toBe(2);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("notifies only on a real change and keeps the last answer when a read fails", async () => {
    const driver = new AccessibilityInfoSystemAccessibilityDriver();
    const listener = vi.fn();
    driver.subscribe(listener);
    await settle();
    const first = driver.current();
    emit("reduceMotionChanged");
    await settle();
    expect(driver.current()).toBe(first);
    state.fail = true;
    state.reduceMotion = true;
    emit("reduceMotionChanged");
    await settle();
    expect(driver.current()).toBe(first);
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops watching after the last listener leaves", () => {
    const driver = new AccessibilityInfoSystemAccessibilityDriver();
    const stopFirst = driver.subscribe(() => undefined);
    const stopSecond = driver.subscribe(() => undefined);
    expect(state.listeners.get("reduceMotionChanged")?.size).toBe(1);
    stopFirst();
    stopFirst();
    expect(state.listeners.get("reduceMotionChanged")?.size).toBe(1);
    stopSecond();
    expect([...state.listeners.values()].every((set) => set.size === 0)).toBe(true);
  });
});
