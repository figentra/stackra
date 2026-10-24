// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `ElectronPlatformDriver`: the web set as `WebPlatformDriver` detects it, plus windows, tray,
 *          updates and saving to a picked folder once the preload's `window.stackra` is present.
 * Boundary: test only; jsdom stands in for the renderer, and `window.stackra` is stubbed.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0250; ADR 0281 (decision 2).
 */
import { afterEach, describe, expect, it, vi } from "@stackra/testing";

import { WebPlatformDriver } from "#browser/drivers/web-platform.driver";
import { Capability } from "#core/enums/capability.enum";
import { ElectronPlatformDriver } from "#electron/drivers/electron-platform.driver";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ElectronPlatformDriver", () => {
  it("offers the web set only when opened without the preload", () => {
    const platform = new ElectronPlatformDriver();
    expect(platform).toBeInstanceOf(WebPlatformDriver);
    expect(platform.has(Capability.Network)).toBe(true);
    expect(platform.has(Capability.Tray)).toBe(false);
  });

  it("adds the desktop capabilities under the preload", () => {
    vi.stubGlobal("stackra", { invoke: vi.fn(), on: vi.fn() });
    const platform = new ElectronPlatformDriver();
    for (const capability of [
      Capability.Window,
      Capability.Tray,
      Capability.Updates,
      Capability.FilesSave,
    ])
      expect(platform.has(capability)).toBe(true);
    expect(platform.has(Capability.Bluetooth)).toBe(false);
  });
});
