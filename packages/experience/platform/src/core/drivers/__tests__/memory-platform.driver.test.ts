/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPlatformDriver`: network only by default; `configure` offers and sets each
 *          capability; refusals for a capability not offered and a denied permission; the scanner's view and `emit`;
 *          the share inbox read once; badge, share, haptics and install recorded.
 * Boundary: test only; no device, no DOM.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (fakes are real drivers); ADR 0250 (decisions 2 and 3).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Platform } from "#contracts/ports/platform.port";
import type { ScannerViewProps } from "#contracts/types/scanner-view-props.type";
import { MemoryPlatformDriver } from "#core/drivers/memory-platform.driver";
import { PlatformCapability } from "#core/enums/platform-capability.enum";

describe("MemoryPlatformDriver", () => {
  it("is a Platform that offers only the network, online", () => {
    const platform = new MemoryPlatformDriver();
    expect(platform).toBeInstanceOf(Platform);
    expect(platform.has(PlatformCapability.Network)).toBe(true);
    expect(platform.has(PlatformCapability.LocalNotifications)).toBe(false);
    expect(platform.has(PlatformCapability.Required)).toBe(false);
    expect(platform.network.isOnline.get()).toBe(true);
  });

  it("refuses notifications that are not offered or denied, and grants a prompt", async () => {
    const platform = new MemoryPlatformDriver();
    expect(await platform.notifications.requestPermission()).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "local_notifications" },
    });
    platform.configure({
      capabilities: [PlatformCapability.LocalNotifications],
      permissions: { [PlatformCapability.LocalNotifications]: "denied" },
    });
    expect(await platform.notifications.requestPermission()).toEqual({
      ok: false,
      error: { code: "permission_denied", capability: "local_notifications" },
    });
    const granting = new MemoryPlatformDriver().configure({
      capabilities: [PlatformCapability.LocalNotifications],
    });
    expect(granting.notifications.permission).toBe("prompt");
    expect(await granting.notifications.requestPermission()).toEqual({ ok: true, data: undefined });
    expect(granting.notifications.permission).toBe("granted");
    await granting.notifications.notify("Order paid", { body: "ord_1" });
    expect(granting.notifications.sent).toEqual([{ title: "Order paid", body: "ord_1" }]);
  });

  it("replaces the offered set with capabilities and adds what other options describe", () => {
    const platform = new MemoryPlatformDriver().configure({ capabilities: [] });
    expect(platform.has(PlatformCapability.Network)).toBe(false);
    platform.configure({ network: { isOnline: false }, canInstall: true, launchedFiles: [] });
    expect(platform.has(PlatformCapability.Network)).toBe(true);
    expect(platform.network.isOnline.get()).toBe(false);
    expect(platform.has(PlatformCapability.InstallPrompt)).toBe(true);
    expect(platform.has(PlatformCapability.FileHandling)).toBe(true);
  });

  it("feeds the scanner view rendered last and asks for the camera", async () => {
    const platform = new MemoryPlatformDriver().configure({ scanner: { isAvailable: true } });
    expect(() => platform.scanner.emit("123")).toThrow(/ScannerView/);
    const onBarcode = vi.fn();
    const render = platform.scanner.View as (props: ScannerViewProps) => null; // a function component
    expect(render({ onBarcode })).toBeNull();
    platform.scanner.emit("6281000000012");
    expect(onBarcode).toHaveBeenCalledWith("6281000000012");
    expect(platform.scanner.isAvailable).toBe(true);
    expect(await platform.scanner.requestPermission()).toBe("granted");
    expect(platform.scanner.permission).toBe("granted");
  });

  it("reports a missing camera and keeps its permission denied", async () => {
    const platform = new MemoryPlatformDriver().configure({ scanner: { isAvailable: false } });
    expect(platform.has(PlatformCapability.Scanner)).toBe(true);
    expect(platform.scanner.isAvailable).toBe(false);
    expect(await platform.scanner.requestPermission()).toBe("denied");
  });

  it("hands a shared payload out once", async () => {
    const payload = { title: "Dates", text: null, url: null, files: [] };
    const platform = new MemoryPlatformDriver().configure({ shared: { abc: payload } });
    expect(await platform.shareTarget.take("abc")).toEqual(payload);
    expect(await platform.shareTarget.take("abc")).toBeNull();
  });

  it("records badge, share, haptics and install, and refuses them when not offered", async () => {
    const platform = new MemoryPlatformDriver();
    expect((await platform.badge.set(3)).ok).toBe(false);
    platform.configure({
      capabilities: [PlatformCapability.Badge, PlatformCapability.Share, PlatformCapability.Haptics],
      canInstall: true,
    });
    await platform.badge.set(3);
    expect(platform.badge.count.get()).toBe(3);
    await platform.badge.clear();
    expect(platform.badge.count.get()).toBe(0);
    expect(await platform.share.share({ url: "https://acme.test" })).toEqual({
      ok: true,
      data: true,
    });
    expect(platform.share.shared).toEqual([{ url: "https://acme.test" }]);
    await platform.haptics.impact();
    expect(platform.haptics.impacts).toEqual(["medium"]);
    expect(await platform.install.prompt()).toEqual({ ok: true, data: true });
    expect(platform.install.canPrompt.get()).toBe(false);
    expect((await platform.install.prompt()).ok).toBe(false);
  });
});
