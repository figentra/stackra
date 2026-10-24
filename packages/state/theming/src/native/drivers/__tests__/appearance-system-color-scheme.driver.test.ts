/**
 * Stackra file contract:
 * Purpose: unit tests of `AppearanceSystemColorSchemeDriver`: a driver of `SystemColorScheme` that reads React
 *          Native's `Appearance` (anything but dark reads light) and forwards its change events until unsubscribed.
 * Boundary: test only; react-native is mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0060.
 */
import { kindOf } from "@stackra/container";
import { beforeEach, describe, expect, it, vi } from "@stackra/testing";

import { SystemColorScheme } from "#contracts/index";
import { AppearanceSystemColorSchemeDriver } from "#native/drivers/appearance-system-color-scheme.driver";

const appearance = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  return {
    listeners,
    scheme: "light" as string | null,
    Appearance: {
      getColorScheme: () => appearance.scheme,
      addChangeListener: (listener: () => void) => {
        listeners.add(listener);
        return { remove: () => listeners.delete(listener) };
      },
    },
  };
});

vi.mock("react-native", () => ({ Appearance: appearance.Appearance }));

beforeEach(() => {
  appearance.scheme = "light";
  appearance.listeners.clear();
});

describe("AppearanceSystemColorSchemeDriver", () => {
  it("is a driver of SystemColorScheme", () => {
    expect(new AppearanceSystemColorSchemeDriver()).toBeInstanceOf(SystemColorScheme);
    expect(kindOf(AppearanceSystemColorSchemeDriver)).toEqual({
      kind: "driver",
      options: { port: SystemColorScheme },
    });
  });

  it("reads dark as dark and anything else as light", () => {
    const driver = new AppearanceSystemColorSchemeDriver();
    appearance.scheme = "dark";
    expect(driver.current()).toBe("dark");
    for (const scheme of ["light", "unspecified", null]) {
      appearance.scheme = scheme;
      expect(driver.current()).toBe("light");
    }
  });

  it("forwards appearance changes until unsubscribed", () => {
    const listener = vi.fn();
    const stop = new AppearanceSystemColorSchemeDriver().subscribe(listener);
    for (const notify of appearance.listeners) notify();
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    expect(appearance.listeners.size).toBe(0);
  });
});
