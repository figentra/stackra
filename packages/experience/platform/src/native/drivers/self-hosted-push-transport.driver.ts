/**
 * Stackra file contract:
 * Purpose: `SelfHostedPushTransportDriver` (`platform.push.provider: "self_hosted"`), the `PlatformPushTransport` driver for
 *          an app that sends pushes through its own APNs and FCM credentials instead of Expo's service: the
 *          permission through expo-notifications and the native device token.
 * Boundary: device only. The provider is `apns` on iOS and `fcm` on Android, so the notifications service knows which
 *           gateway the token belongs to. Retries, the devices-module registration and channel creation are the push
 *           context's.
 * Runtime: react-native
 * Governing contract: ADR 0255 (decision 3); ADR 0235 (devices); ADR 0294 (decision 17: dependencies by type).
 */
import { Driver } from "@stackra/container";
import * as Notifications from "expo-notifications";
import { Linking } from "react-native";

import type { PushConfig } from "#config/push.config";
import { PlatformPushTransport } from "#contracts/ports/platform-push-transport.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { PushRegistration } from "#contracts/types/push-registration.type";
import { PlatformCapability } from "#core/enums/platform-capability.enum";
import { refuse } from "#core/functions/refuse.function";
import { readPushPermission } from "#native/functions/read-push-permission.function";
import { requestPushPermission } from "#native/functions/request-push-permission.function";

/**
 * Native APNs and FCM push on the device.
 *
 * @example
 * const registration = await transport.register(); // { ok: true, data: { provider: "fcm", token: "..." } }
 */
export class SelfHostedPushTransportDriver extends Driver(PlatformPushTransport) {
  /** The push configuration (`iosProvisional`). */
  private readonly config: PushConfig;

  /**
   * @param config - the push configuration.
   */
  constructor(config: PushConfig) {
    super();
    this.config = config;
  }

  /** Where the push permission stands. */
  permission(): Promise<PermissionStatus> {
    return readPushPermission();
  }

  /** Shows the OS prompt when the permission is not decided. */
  requestPermission(): Promise<PermissionStatus> {
    return requestPushPermission(this.config);
  }

  /** Opens this app's page in the OS settings. */
  openSettings(): Promise<void> {
    return Linking.openSettings();
  }

  /** The native device token, once the permission is granted. */
  async register(): Promise<CapabilityResult<PushRegistration>> {
    if ((await readPushPermission()) !== "granted")
      return refuse(PlatformCapability.Push, "permission_denied");
    const token = await Notifications.getDevicePushTokenAsync();
    return {
      ok: true,
      data: { provider: token.type === "ios" ? "apns" : "fcm", token: String(token.data) },
    };
  }
}
