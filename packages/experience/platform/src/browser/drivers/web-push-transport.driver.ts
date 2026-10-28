/**
 * Stackra file contract:
 * Purpose: `WebPushTransportDriver`, the `PlatformPushTransport` driver of the PWA (`platform.push.provider: "web"`): the
 *          notification permission and a Web Push subscription made with the app's VAPID public key, returned as
 *          JSON for the devices module (ADR 0255 decision 3).
 * Boundary: browser only; it reuses an existing subscription. A browser without Web Push (iOS outside an installed
 *           app) refuses with `unavailable`, so notifications stay in-app. A browser offers no settings page to open,
 *           so `openSettings` resolves without doing anything.
 * Runtime: browser
 * Governing contract: ADR 0255 (decision 3); ADR 0235 (devices); ADR 0294 (decision 17: dependencies by type).
 */
import { Driver } from "@stackra/container";

import type { PushConfig } from "#config/push.config";
import { PlatformPushTransport } from "#contracts/ports/platform-push-transport.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { PushRegistration } from "#contracts/types/push-registration.type";
import { PlatformCapability } from "#core/enums/platform-capability.enum";
import { refuse } from "#core/functions/refuse.function";
import { browserPermission } from "#browser/functions/browser-permission.function";
import { urlBase64ToBytes } from "#browser/functions/url-base64-to-bytes.function";

/**
 * Web Push in the browser.
 *
 * @example
 * const registration = await transport.register(); // { ok: true, data: { provider: "web_push", token: "{...}" } }
 */
export class WebPushTransportDriver extends Driver(PlatformPushTransport) {
  /** The push configuration (`vapidPublicKey`). */
  private readonly config: PushConfig;

  /**
   * @param config - the push configuration; its `vapidPublicKey` signs the subscription.
   */
  constructor(config: PushConfig) {
    super();
    this.config = config;
  }

  /** Where the notification permission stands. */
  async permission(): Promise<PermissionStatus> {
    return browserPermission();
  }

  /** Asks for the notification permission. */
  async requestPermission(): Promise<PermissionStatus> {
    if (!("Notification" in globalThis)) return "denied";
    return browserPermission(await Notification.requestPermission());
  }

  /** A browser has no app settings page to open. */
  async openSettings(): Promise<void> {}

  /**
   * The Web Push subscription as JSON.
   *
   * @throws TypeError when `platform.push.vapidPublicKey` is empty.
   */
  async register(): Promise<CapabilityResult<PushRegistration>> {
    if (!("PushManager" in globalThis) || !("serviceWorker" in navigator))
      return refuse(PlatformCapability.Push, "unavailable");
    if (browserPermission() !== "granted") return refuse(PlatformCapability.Push, "permission_denied");
    if (this.config.vapidPublicKey === "")
      throw new TypeError(
        "platform.push.vapidPublicKey is empty: the web transport cannot subscribe",
      );
    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBytes(this.config.vapidPublicKey),
      }));
    return { ok: true, data: { provider: "web_push", token: JSON.stringify(subscription) } };
  }
}
