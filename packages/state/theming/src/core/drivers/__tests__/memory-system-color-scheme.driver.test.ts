/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySystemColorSchemeDriver`: a driver of `SystemColorScheme` that starts light, changes
 *          on `set`, and notifies its subscribers on a real change only, until they unsubscribe.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SystemColorScheme } from "#contracts/ports/system-color-scheme.port";
import { MemorySystemColorSchemeDriver } from "#core/drivers/memory-system-color-scheme.driver";

describe("MemorySystemColorSchemeDriver", () => {
  it("is a driver of SystemColorScheme", () => {
    expect(new MemorySystemColorSchemeDriver()).toBeInstanceOf(SystemColorScheme);
    expect(kindOf(MemorySystemColorSchemeDriver)).toEqual({
      kind: "driver",
      options: { port: SystemColorScheme },
    });
  });

  it("starts light and changes on set", () => {
    const driver = new MemorySystemColorSchemeDriver();
    expect(driver.current()).toBe("light");
    expect(driver.set("dark")).toBe(driver);
    expect(driver.current()).toBe("dark");
  });

  it("notifies on a real change until unsubscribed", () => {
    const driver = new MemorySystemColorSchemeDriver();
    const listener = vi.fn();
    const stop = driver.subscribe(listener);
    driver.set("light");
    expect(listener).not.toHaveBeenCalled();
    driver.set("dark");
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    driver.set("light");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
