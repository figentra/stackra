/**
 * Stackra file contract:
 * Purpose: unit tests of `ElectronPlatformDriver`: the web set as `WebPlatformDriver` detects it, plus windows, tray,
 *          updates and saving to a picked folder once the preload's `window.stackra` is present.
 * Boundary: test only; jsdom stands in for the renderer, and `window.stackra` is stubbed.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0250; ADR 0281 (decision 2).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { WebPlatformDriver } from "#browser/drivers/web-platform.driver";
import { PlatformCapability } from "#core/enums/platform-capability.enum";
import { ElectronPlatformDriver } from "#desktop/drivers/electron-platform.driver";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ElectronPlatformDriver", () => {
  it("offers the web set only when opened without the preload", () => {
    const platform = new ElectronPlatformDriver();
    expect(platform).toBeInstanceOf(WebPlatformDriver);
    expect(platform.has(PlatformCapability.Network)).toBe(true);
    expect(platform.has(PlatformCapability.Tray)).toBe(false);
  });

  it("adds the desktop capabilities under the preload", () => {
    vi.stubGlobal("stackra", { invoke: vi.fn(), on: vi.fn() });
    const platform = new ElectronPlatformDriver();
    for (const capability of [
      PlatformCapability.Window,
      PlatformCapability.Tray,
      PlatformCapability.Updates,
      PlatformCapability.FilesSave,
    ])
      expect(platform.has(capability)).toBe(true);
    expect(platform.has(PlatformCapability.Bluetooth)).toBe(false);
  });
});
