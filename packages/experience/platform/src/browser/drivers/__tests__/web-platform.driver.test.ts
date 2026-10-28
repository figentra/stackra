/**
 * Stackra file contract:
 * Purpose: unit tests of `WebPlatformDriver`: online state follows the browser's events; capabilities are detected
 *          from the browser's APIs; the notification permission, a share the user closed, the deferred install
 *          prompt, the launch queue and the share inbox each behave as the port says; a server render offers only
 *          the network.
 * Boundary: test only; jsdom, with each browser API the test needs stubbed on `globalThis` or `navigator`; IndexedDB
 *           is `fake-indexeddb`.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0250 (decisions 2 and 3); ADR 0255.
 */
// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { WebPlatformDriver } from "#browser/drivers/web-platform.driver";
import { Platform } from "#contracts/ports/platform.port";
import { putSharedPayload } from "#core/functions/put-shared-payload.function";
import { PlatformCapability } from "#core/enums/platform-capability.enum";

/** Defines `value` as `navigator[name]` for one test. */
function stubNavigator(name: string, value: unknown): void {
  Object.defineProperty(navigator, name, { value, configurable: true, writable: true });
}

afterEach(() => {
  vi.unstubAllGlobals();
  for (const name of ["share", "serviceWorker", "vibrate"]) Reflect.deleteProperty(navigator, name);
});

describe("WebPlatformDriver", () => {
  it("is a Platform whose online state follows the browser", () => {
    const platform = new WebPlatformDriver();
    expect(platform).toBeInstanceOf(Platform);
    expect(platform.has(PlatformCapability.Network)).toBe(true);
    window.dispatchEvent(new Event("offline"));
    expect(platform.network.isOnline.get()).toBe(false);
    window.dispatchEvent(new Event("online"));
    expect(platform.network.isOnline.get()).toBe(true);
  });

  it("offers only the network during a server render", () => {
    vi.stubGlobal("window", undefined);
    const platform = new WebPlatformDriver();
    expect(platform.has(PlatformCapability.Network)).toBe(true);
    expect(platform.has(PlatformCapability.Share)).toBe(false);
  });

  it("asks for the notification permission and refuses a denial", async () => {
    let answer: NotificationPermission = "granted";
    const shown: string[] = [];
    vi.stubGlobal(
      "Notification",
      class {
        static permission: NotificationPermission = "default";

        static requestPermission = async () => answer;

        constructor(title: string) {
          shown.push(title);
        }
      },
    );
    const platform = new WebPlatformDriver();
    expect(platform.notifications.permission).toBe("prompt");
    expect(await platform.notifications.requestPermission()).toEqual({ ok: true, data: undefined });
    answer = "denied";
    expect(await platform.notifications.requestPermission()).toEqual({
      ok: false,
      error: { code: "permission_denied", capability: "local_notifications" },
    });
    (globalThis.Notification as unknown as { permission: string }).permission = "granted";
    expect(await platform.notifications.notify("Order paid")).toEqual({
      ok: true,
      data: undefined,
    });
    expect(shown).toEqual(["Order paid"]);
  });

  it("refuses a share the browser cannot make and accepts a closed sheet", async () => {
    const platform = new WebPlatformDriver();
    expect(await platform.share.share({ url: "https://acme.test" })).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "share" },
    });
    stubNavigator(
      "share",
      vi.fn(async () => Promise.reject(new DOMException("closed", "AbortError"))),
    );
    expect(await platform.share.share({ url: "https://acme.test" })).toEqual({
      ok: true,
      data: false,
    });
  });

  it("vibrates for haptics where the browser can", async () => {
    stubNavigator(
      "vibrate",
      vi.fn(() => true),
    );
    const platform = new WebPlatformDriver();
    expect(await platform.haptics.impact("heavy")).toEqual({ ok: true, data: undefined });
    expect(navigator.vibrate).toHaveBeenCalledWith(40);
  });

  it("holds the install prompt and shows it once", async () => {
    const platform = new WebPlatformDriver();
    expect((await platform.install.prompt()).ok).toBe(false);
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt: vi.fn(async () => undefined),
      userChoice: Promise.resolve({ outcome: "accepted" as const }),
    });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(platform.install.canPrompt.get()).toBe(true);
    expect(await platform.install.prompt()).toEqual({ ok: true, data: true });
    expect(platform.install.canPrompt.get()).toBe(false);
  });

  it("keeps the files of the latest launch", async () => {
    let consumer: ((params: { files: { getFile(): Promise<File> }[] }) => void) | undefined;
    vi.stubGlobal("launchQueue", { setConsumer: (next: typeof consumer) => (consumer = next) });
    const platform = new WebPlatformDriver();
    expect(platform.has(PlatformCapability.FileHandling)).toBe(true);
    const file = new File(["png"], "photo.png");
    consumer?.({ files: [{ getFile: async () => file }] });
    await vi.waitFor(() => expect(platform.fileHandling.launched.get()).toEqual([file]));
  });

  it("takes a shared payload from the inbox once", async () => {
    stubNavigator("serviceWorker", {});
    const platform = new WebPlatformDriver();
    const id = await putSharedPayload({ title: "Dates", text: null, url: null, files: [] });
    expect((await platform.shareTarget.take(id))?.title).toBe("Dates");
    expect(await platform.shareTarget.take(id)).toBeNull();
  });
});
