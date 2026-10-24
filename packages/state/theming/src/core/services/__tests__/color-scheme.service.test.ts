/**
 * Stackra file contract:
 * Purpose: unit tests of `ColorSchemeService`: it starts from the default scheme, reads and keeps the choice in the
 *          `prefs` area (a hydration after construction included), ignores a stored value the configuration does not
 *          offer, resolves `system` through the port, keeps one snapshot until something changes, notifies on a real
 *          change only, watches the system preference only while subscribed, refuses a scheme not on offer and a
 *          default outside the schemes, and serves a fixed initial state for server renders.
 * Boundary: test only; the real memory storage and memory system drivers, no mocks.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0060; ADR 0256 (decision 2).
 */
import { buildConfig } from "@stackra/config";
import { MemoryStorageDriver } from "@stackra/storage";
import { describe, expect, it, vi } from "@stackra/testing";
import type { ColorScheme } from "@stackra/ui/contracts";

import { ThemingConfig } from "#config/theming.config";
import { MemorySystemColorSchemeDriver } from "#core/drivers/memory-system-color-scheme.driver";
import { ColorSchemeService } from "#core/services/color-scheme.service";

class LightDarkThemingConfig extends ThemingConfig {
  override schemes: ColorScheme[] = ["light", "dark"];

  override defaultScheme: ColorScheme = "light";
}

/** A service over fresh memory storage and a memory system preference. */
function build(config: ThemingConfig = buildConfig(ThemingConfig)) {
  const storage = new MemoryStorageDriver();
  const system = new MemorySystemColorSchemeDriver();
  return { storage, system, service: new ColorSchemeService(config, storage, system) };
}

describe("ColorSchemeService", () => {
  it("starts from the default scheme, resolving system through the port", () => {
    const { service, system } = build();
    expect(service.scheme).toBe("system");
    expect(service.state()).toMatchObject({ scheme: "system", resolved: "light" });
    system.set("dark");
    expect(service.state().resolved).toBe("dark");
  });

  it("keeps the choice in the prefs area and reads it back", () => {
    const { service, storage, system } = build();
    service.setScheme("dark");
    expect(storage.prefs.get("theming.scheme")).toBe("dark");
    const again = new ColorSchemeService(buildConfig(ThemingConfig), storage, system);
    expect(again.scheme).toBe("dark");
  });

  it("sees a choice that storage hydrates after it was built", () => {
    const { service, storage } = build();
    expect(service.scheme).toBe("system");
    storage.prefs.set("theming.scheme", "light");
    expect(service.state()).toMatchObject({ scheme: "light", resolved: "light" });
  });

  it("reads a stored scheme the configuration does not offer as the default", () => {
    const { storage, system } = build();
    storage.prefs.set("theming.scheme", "system");
    const service = new ColorSchemeService(buildConfig(LightDarkThemingConfig), storage, system);
    expect(service.scheme).toBe("light");
    storage.prefs.set("theming.scheme", 42);
    expect(service.scheme).toBe("light");
  });

  it("keeps one frozen snapshot until something changes", () => {
    const { service } = build();
    const first = service.state();
    expect(Object.isFrozen(first)).toBe(true);
    expect(service.state()).toBe(first);
    service.setScheme("dark");
    expect(service.state()).not.toBe(first);
    expect(service.state().setScheme).toBe(service.setScheme);
  });

  it("notifies on a real change only", () => {
    const { service, system } = build();
    const listener = vi.fn();
    service.subscribe(listener);
    service.setScheme("dark");
    service.setScheme("dark");
    expect(listener).toHaveBeenCalledTimes(1);
    system.set("dark");
    expect(listener).toHaveBeenCalledTimes(1);
    service.setScheme("system");
    expect(listener).toHaveBeenCalledTimes(2);
    expect(service.state().resolved).toBe("dark");
  });

  it("follows the system preference while subscribed, and stops after the last unsubscribe", () => {
    const { service, system } = build();
    const subscribe = vi.spyOn(system, "subscribe");
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = service.subscribe(first);
    const stopSecond = service.subscribe(second);
    expect(subscribe).toHaveBeenCalledTimes(1);
    system.set("dark");
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    stopFirst();
    stopFirst();
    system.set("light");
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
    stopSecond();
    system.set("dark");
    expect(second).toHaveBeenCalledTimes(2);
    service.subscribe(first);
    expect(subscribe).toHaveBeenCalledTimes(2);
  });

  it("refuses a scheme the configuration does not offer, storing nothing", () => {
    const { storage, system } = build();
    const service = new ColorSchemeService(buildConfig(LightDarkThemingConfig), storage, system);
    expect(() => service.setScheme("system")).toThrow(RangeError);
    expect(storage.prefs.has("theming.scheme")).toBe(false);
  });

  it("refuses a default scheme outside its schemes", () => {
    class BrokenThemingConfig extends ThemingConfig {
      override schemes: ColorScheme[] = ["light", "dark"];
    }
    expect(() => build(buildConfig(BrokenThemingConfig))).toThrow(/defaultScheme "system"/);
  });

  it("serves the default scheme as the initial state, system shown as light", () => {
    const { service, system } = build();
    system.set("dark");
    service.setScheme("dark");
    expect(service.initialState()).toMatchObject({ scheme: "system", resolved: "light" });
    expect(service.initialState()).toBe(service.initialState());
    const dark = build(buildConfig(LightDarkThemingConfig)).service;
    expect(dark.initialState()).toMatchObject({ scheme: "light", resolved: "light" });
  });
});
