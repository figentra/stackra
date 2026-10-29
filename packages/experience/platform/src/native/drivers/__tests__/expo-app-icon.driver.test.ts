/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoAppIconDriver`: it reads support and the icon showing through expo-alternate-app-icons,
 *          switches and follows what the library reports, and refuses `unavailable` without the library, without
 *          support, or when the library rejects the name.
 * Boundary: test only; expo-alternate-app-icons is mocked, and a subclass also hands fakes in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0250 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AppIcon } from "#contracts/ports/app-icon.port";
import { ExpoAppIconDriver } from "#native/drivers/expo-app-icon.driver";
import type { ExpoAppIconModule } from "#native/types/expo-app-icon-module.type";

vi.mock("expo-alternate-app-icons", () => ({
  supportsAlternateIcons: true,
  getAppIconName: () => "Winter",
  setAlternateAppIcon: async (name: string | null) => name,
}));

/** A driver over `module`. */
function driverWith(module: ExpoAppIconModule): ExpoAppIconDriver {
  return new (class extends ExpoAppIconDriver {
    protected override readonly module = module;
  })();
}

describe("ExpoAppIconDriver", () => {
  it("reads through the library it imports", () => {
    const appIcon = new ExpoAppIconDriver();
    expect(appIcon).toBeInstanceOf(AppIcon);
    expect(appIcon.isSupported).toBe(true);
    expect(appIcon.current.get()).toBe("Winter");
  });

  it("switches and follows the icon the library reports", async () => {
    const setAlternateAppIcon = vi.fn(async () => "Ramadan");
    const appIcon = driverWith({
      supportsAlternateIcons: true,
      getAppIconName: () => null,
      setAlternateAppIcon,
    });
    const seen: (string | null)[] = [];
    appIcon.current.subscribe((icon) => seen.push(icon));
    expect(await appIcon.set("Ramadan")).toEqual({ ok: true, data: undefined });
    expect(setAlternateAppIcon).toHaveBeenCalledWith("Ramadan");
    expect(seen).toEqual(["Ramadan"]);
  });

  it("refuses without the library, without support, or for a name the build lacks", async () => {
    const refused = { ok: false, error: { code: "unavailable", capability: "app_icon" } };
    const absent = driverWith(null);
    expect(absent.isSupported).toBe(false);
    expect(absent.current.get()).toBeNull();
    expect(await absent.set("Ramadan")).toEqual(refused);
    const unsupported = driverWith({
      supportsAlternateIcons: false,
      getAppIconName: () => null,
      setAlternateAppIcon: async () => null,
    });
    expect(await unsupported.set("Ramadan")).toEqual(refused);
    const rejecting = driverWith({
      supportsAlternateIcons: true,
      getAppIconName: () => null,
      setAlternateAppIcon: async () => {
        throw new Error("no such icon");
      },
    });
    expect(await rejecting.set("Ramadan")).toEqual(refused);
    expect(rejecting.current.get()).toBeNull();
  });
});
