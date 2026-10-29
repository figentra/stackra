/**
 * Stackra file contract:
 * Purpose: unit tests of `ExpoDeviceSearchIndexDriver`: items reach the module with `details` for the description,
 *          nothing is indexed when the OS offers no index, remove and clear pass through, `opened` hands over the
 *          launching link and then each event, and a build without the module keeps and hears nothing.
 * Boundary: test only; `expo` is mocked and a subclass hands a stand-in module in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0478 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DeviceSearchIndex } from "#contracts/ports/device-search-index.port";
import { ExpoDeviceSearchIndexDriver } from "#native/drivers/expo-device-search-index.driver";
import type { SpotlightNativeModule } from "#native/types/spotlight-native-module.type";

vi.mock("expo", () => ({ requireOptionalNativeModule: () => null }));

/** A stand-in `StackraSpotlight` module that records calls. */
function fakeModule(options: { isAvailable?: boolean; launched?: string | null } = {}) {
  let onOpen: ((event: { url: string }) => void) | undefined;
  const removed = vi.fn();
  const module = {
    isAvailable: () => options.isAvailable ?? true,
    index: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    removeAll: vi.fn(async () => undefined),
    takeOpened: () => options.launched ?? null,
    addListener: (_name: "onOpen", listener: (event: { url: string }) => void) => {
      onOpen = listener;
      return { remove: removed };
    },
  };
  return { module, removed, emit: (url: string) => onOpen?.({ url }) };
}

/** A driver over `module`. */
function driverWith(module: unknown): ExpoDeviceSearchIndexDriver {
  return new (class extends ExpoDeviceSearchIndexDriver {
    protected override readonly module = module as SpotlightNativeModule | null;
  })();
}

/** One entry. */
const ITEM = {
  url: "figentra://crm/customers/cus_1",
  kind: "crm.customer",
  title: "Sara",
  description: "Riyadh",
  keywords: ["vip"],
};

describe("ExpoDeviceSearchIndexDriver", () => {
  it("indexes through the module, the description as details", async () => {
    const { module } = fakeModule();
    const driver = driverWith(module);
    expect(driver).toBeInstanceOf(DeviceSearchIndex);
    await driver.index([ITEM]);
    expect(module.index).toHaveBeenCalledWith([
      { url: ITEM.url, kind: ITEM.kind, title: "Sara", details: "Riyadh", keywords: ["vip"] },
    ]);
  });

  it("indexes nothing when the OS offers no index, and passes remove and clear through", async () => {
    const { module } = fakeModule({ isAvailable: false });
    const driver = driverWith(module);
    await driver.index([ITEM]);
    expect(module.index).not.toHaveBeenCalled();
    await driver.remove([ITEM.url]);
    await driver.clear();
    expect(module.remove).toHaveBeenCalledWith([ITEM.url]);
    expect(module.removeAll).toHaveBeenCalledOnce();
  });

  it("hands over the launching link, then each opened entry, until stopped", () => {
    const { module, removed, emit } = fakeModule({ launched: "figentra://a" });
    const opened: string[] = [];
    const stop = driverWith(module).opened((url) => opened.push(url));
    emit("figentra://b");
    stop();
    expect(opened).toEqual(["figentra://a", "figentra://b"]);
    expect(removed).toHaveBeenCalledOnce();
  });

  it("keeps and hears nothing without the module", async () => {
    const driver = new ExpoDeviceSearchIndexDriver();
    await driver.index([ITEM]);
    await driver.clear();
    expect(() => driver.opened(() => undefined)()).not.toThrow();
  });
});
