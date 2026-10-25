/**
 * Stackra file contract:
 * Purpose: `ExpoPushTransportDriver` (`platform.push.provider: "expo"`), the `PushTransport` driver that registers
 *          the device with Expo's push service: the permission through expo-notifications and an Expo push token for
 *          the app's EAS project.
 * Boundary: device only. The project id comes from the build's EAS config (`easConfig.projectId`, or
 *           `extra.eas.projectId`); a build without one asks without it, which a development client allows. Retries,
 *           the devices-module registration and channel creation are the push context's.
 * Runtime: react-native
 * Governing contract: ADR 0255 (decision 3); ADR 0235 (devices); ADR 0294 (decision 17: dependencies by type).
 */
import { Driver } from "@stackra/container";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Linking } from "react-native";

import { PushConfig } from "#config/push.config";
import { PushTransport } from "#contracts/ports/push-transport.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { PushRegistration } from "#contracts/types/push-registration.type";
import { Capability } from "#core/enums/capability.enum";
import { refuse } from "#core/functions/refuse.function";
import { readPushPermission } from "#native/functions/read-push-permission.function";
import { requestPushPermission } from "#native/functions/request-push-permission.function";

/**
 * Expo push on the device.
 *
 * @example
 * // generated wiring, expo target
 * { port: PushTransport, selectedBy: "config:platform.push.provider", candidates: { expo: () => import("@stackra/platform/native").then((m) => m.ExpoPushTransportDriver) } }
 */
export class ExpoPushTransportDriver extends Driver(PushTransport) {
  /** The push configuration (`iosProvisional`). */
  private readonly config: PushConfig;

  /** @param config - the push configuration. */
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

  /** The Expo push token, once the permission is granted. */
  async register(): Promise<CapabilityResult<PushRegistration>> {
    if ((await readPushPermission()) !== "granted")
      return refuse(Capability.Push, "permission_denied");
    const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
    const projectId = Constants.easConfig?.projectId ?? extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(
      projectId === undefined ? {} : { projectId },
    );
    return { ok: true, data: { provider: "expo", token: token.data } };
  }
}
