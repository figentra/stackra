/**
 * Stackra file contract:
 * Purpose: unit tests of `BrowserSystemAccessibilityDriver`: it reads `prefers-reduced-motion` and `prefers-contrast`,
 *          keeps the same snapshot while nothing changes, reads the defaults without `matchMedia`, and forwards both
 *          queries' change events until unsubscribed.
 * Boundary: test only; `matchMedia` is stubbed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0302 (decision 3, 2026-10-29 note).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { BrowserSystemAccessibilityDriver } from "#browser/drivers/browser-system-accessibility.driver";
import { DEFAULT_ACCESSIBILITY_SETTINGS, SystemAccessibility } from "#contracts/index";

/** Stubs `matchMedia` with the queries in `matching`, recording each query's listeners. */
function stubMatchMedia(matching: Set<string>) {
  const listeners = new Map<string, Set<() => void>>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return matching.has(query);
    },
    addEventListener: (_: string, listener: () => void) => {
      listeners.set(query, (listeners.get(query) ?? new Set()).add(listener));
    },
    removeEventListener: (_: string, listener: () => void) => {
      listeners.get(query)?.delete(listener);
    },
  }));
  return listeners;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BrowserSystemAccessibilityDriver", () => {
  it("is a driver of SystemAccessibility", () => {
    expect(new BrowserSystemAccessibilityDriver()).toBeInstanceOf(SystemAccessibility);
  });

  it("reads both media queries and keeps the snapshot while nothing changes", () => {
    const matching = new Set<string>();
    stubMatchMedia(matching);
    const driver = new BrowserSystemAccessibilityDriver();
    expect(driver.current()).toBe(DEFAULT_ACCESSIBILITY_SETTINGS);
    matching.add("(prefers-reduced-motion: reduce)");
    matching.add("(prefers-contrast: more)");
    const changed = driver.current();
    expect(changed).toEqual({
      reduceMotion: true,
      boldText: false,
      highContrast: true,
      fontScale: 1,
    });
    expect(driver.current()).toBe(changed);
  });

  it("reads the defaults without matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    const driver = new BrowserSystemAccessibilityDriver();
    expect(driver.current()).toBe(DEFAULT_ACCESSIBILITY_SETTINGS);
    expect(() => driver.subscribe(() => undefined)()).not.toThrow();
  });

  it("forwards both queries' changes until unsubscribed", () => {
    const listeners = stubMatchMedia(new Set());
    const listener = vi.fn();
    const stop = new BrowserSystemAccessibilityDriver().subscribe(listener);
    expect([...listeners.keys()]).toEqual([
      "(prefers-reduced-motion: reduce)",
      "(prefers-contrast: more)",
    ]);
    for (const set of listeners.values()) for (const notify of set) notify();
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
    expect([...listeners.values()].every((set) => set.size === 0)).toBe(true);
  });
});
