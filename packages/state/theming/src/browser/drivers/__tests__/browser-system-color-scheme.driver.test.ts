/**
 * Stackra file contract:
 * Purpose: unit tests of `BrowserSystemColorSchemeDriver`: a driver of `SystemColorScheme` that reads the
 *          `prefers-color-scheme: dark` media query, forwards its change events until unsubscribed, and reads light
 *          without `matchMedia`.
 * Boundary: test only; `matchMedia` is a stub global, so no DOM is needed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0060.
 */
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { BrowserSystemColorSchemeDriver } from "#browser/drivers/browser-system-color-scheme.driver";
import { SystemColorScheme } from "#contracts/index";

/** A stub `prefers-color-scheme: dark` query whose answer and change events the test drives. */
function stubDarkQuery(matches: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  };
  const matchMedia = vi.fn(() => query);
  vi.stubGlobal("matchMedia", matchMedia);
  return {
    matchMedia,
    listeners,
    change(next: boolean) {
      query.matches = next;
      for (const listener of listeners) listener();
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BrowserSystemColorSchemeDriver", () => {
  it("is a driver of SystemColorScheme", () => {
    expect(new BrowserSystemColorSchemeDriver()).toBeInstanceOf(SystemColorScheme);
    expect(kindOf(BrowserSystemColorSchemeDriver)).toEqual({
      kind: "driver",
      options: { port: SystemColorScheme },
    });
  });

  it("reads the dark media query", () => {
    const media = stubDarkQuery(true);
    const driver = new BrowserSystemColorSchemeDriver();
    expect(driver.current()).toBe("dark");
    expect(media.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    media.change(false);
    expect(driver.current()).toBe("light");
  });

  it("forwards change events until unsubscribed", () => {
    const media = stubDarkQuery(false);
    const listener = vi.fn();
    const stop = new BrowserSystemColorSchemeDriver().subscribe(listener);
    media.change(true);
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    expect(media.listeners.size).toBe(0);
    media.change(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reads light and never notifies without matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    const driver = new BrowserSystemColorSchemeDriver();
    expect(driver.current()).toBe("light");
    const stop = driver.subscribe(() => undefined);
    expect(() => stop()).not.toThrow();
  });
});
