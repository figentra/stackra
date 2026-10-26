/**
 * Stackra file contract:
 * Purpose: unit tests of `WebPushTransportDriver`: a browser without Web Push refuses with `unavailable`; a granted
 *          permission subscribes with the VAPID key (or reuses a subscription) and returns it as JSON; an empty key
 *          throws; the permission maps `default` to `prompt`.
 * Boundary: test only; jsdom with `Notification`, `PushManager` and `navigator.serviceWorker` stubbed.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0255 (decision 3).
 */
// @vitest-environment jsdom
import { buildConfig } from "@stackra/config";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { WebPushTransportDriver } from "#browser/drivers/web-push-transport.driver";
import { PushConfig } from "#config/push.config";
import { PushTransport } from "#contracts/ports/push-transport.port";

/** A push manager that records the subscribe call. */
function stubPush(existing: object | null = null) {
  const subscribe = vi.fn(async () => ({ endpoint: "https://push.example/new" }));
  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal(
    "Notification",
    class {
      static permission: NotificationPermission = "granted";

      static requestPermission = async (): Promise<NotificationPermission> => "granted";
    },
  );
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: Promise.resolve({ pushManager: { getSubscription: async () => existing, subscribe } }),
    },
  });
  return subscribe;
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("WebPushTransportDriver", () => {
  it("refuses where the browser has no Web Push", async () => {
    const transport = new WebPushTransportDriver(buildConfig(PushConfig));
    expect(transport).toBeInstanceOf(PushTransport);
    expect(await transport.register()).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "push" },
    });
  });

  it("subscribes with the VAPID key and returns the subscription as JSON", async () => {
    const subscribe = stubPush();
    const config = buildConfig(PushConfig, { values: { provider: "web", vapidPublicKey: "AQAB" } });
    const transport = new WebPushTransportDriver(config);
    expect(await transport.permission()).toBe("granted");
    expect(await transport.register()).toEqual({
      ok: true,
      data: {
        provider: "web_push",
        token: JSON.stringify({ endpoint: "https://push.example/new" }),
      },
    });
    expect(subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: new Uint8Array([1, 0, 1]),
    });
  });

  it("reuses an existing subscription", async () => {
    const subscribe = stubPush({ endpoint: "https://push.example/old" });
    const transport = new WebPushTransportDriver(
      buildConfig(PushConfig, { values: { vapidPublicKey: "AQAB" } }),
    );
    const registration = await transport.register();
    expect(registration.ok && registration.data.token).toContain("old");
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("throws on an empty VAPID key", async () => {
    stubPush();
    await expect(new WebPushTransportDriver(buildConfig(PushConfig)).register()).rejects.toThrow(
      /vapidPublicKey/,
    );
  });
});
