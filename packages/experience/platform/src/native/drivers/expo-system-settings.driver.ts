/**
 * Stackra file contract:
 * Purpose: `ExpoSystemSettingsDriver`, the `SystemSettings` driver of the Expo (phone) target: App Tracking
 *          Transparency through expo-tracking-transparency, Low Power Mode through expo-battery, background refresh
 *          through expo-background-task, an expensive connection from NetInfo, and the settings deep link from React
 *          Native's `Linking`.
 * Boundary: device only, and abstract: the host app subclasses it and declares `modules` (the Expo libraries it
 *           ships), because those libraries are the app's own dependencies; the constructor takes nothing. On iOS an
 *           app without expo-tracking-transparency reads tracking as `denied`, since tracking needs the prompt's yes
 *           (ADR 0071 decision 4). NetInfo's `isConnectionExpensive` covers metered and cellular connections; it is
 *           read live. Low Power Mode starts listening on first read.
 * Runtime: react-native
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0071 (decision 4: ATT); ADR 0298 (2026-10-29 note); ADR 0478.
 */
import { addEventListener } from "@react-native-community/netinfo";
import { Driver } from "@stackra/container";
import { Linking, Platform as Os } from "react-native";

import { SystemSettings } from "#contracts/ports/system-settings.port";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { ReadonlySignal } from "#contracts/types/readonly-signal.type";
import { liveValue } from "#core/functions/live-value.function";
import type { LiveValue } from "#core/types/live-value.type";
import { expoPermission } from "#native/functions/expo-permission.function";
import type { ExpoSystemModules } from "#native/types/expo-system-modules.type";

/** expo-background-task's `BackgroundTaskStatus.Available`. */
const BACKGROUND_AVAILABLE = 2;

/**
 * The system settings on a phone.
 *
 * @example
 * import * as BackgroundTask from "expo-background-task";
 * import * as Battery from "expo-battery";
 * import * as TrackingTransparency from "expo-tracking-transparency";
 *
 * export class AppSystemSettingsDriver extends ExpoSystemSettingsDriver {
 *   protected readonly modules = { trackingTransparency: TrackingTransparency, battery: Battery, backgroundTask: BackgroundTask };
 * }
 */
export abstract class ExpoSystemSettingsDriver extends Driver(SystemSettings) {
  /** An expensive connection, from NetInfo. */
  readonly expensiveNetwork: ReadonlySignal<boolean>;

  /** The Expo libraries the app ships; declared by the host's subclass. */
  protected abstract readonly modules: ExpoSystemModules;

  /** Low Power Mode, once something has read it. */
  private lowPower: LiveValue<boolean> | undefined;

  /** Starts listening to NetInfo. */
  constructor() {
    super();
    const expensive = liveValue(false);
    addEventListener((state) => expensive.set(state.details?.isConnectionExpensive === true));
    this.expensiveNetwork = expensive;
  }

  /** Low Power Mode from expo-battery; off when the app does not ship it. */
  get lowPowerMode(): ReadonlySignal<boolean> {
    if (this.lowPower !== undefined) return this.lowPower;
    const lowPower = liveValue(false);
    this.lowPower = lowPower;
    const battery = this.modules.battery;
    if (battery !== null) {
      battery.addLowPowerModeListener((event) => lowPower.set(event.lowPowerMode));
      void battery
        .isLowPowerModeEnabledAsync()
        .then((on) => lowPower.set(on))
        .catch(() => undefined); // an unanswered read keeps "off" until the listener reports
    }
    return lowPower;
  }

  /** Where App Tracking Transparency stands; `null` off iOS. */
  async tracking(): Promise<PermissionStatus | null> {
    if (Os.OS !== "ios") return null;
    const module = this.modules.trackingTransparency;
    return module === null ? "denied" : expoPermission(await module.getTrackingPermissionsAsync());
  }

  /** Shows the App Tracking Transparency prompt when it is not decided. */
  async requestTracking(): Promise<PermissionStatus | null> {
    const current = await this.tracking();
    const module = this.modules.trackingTransparency;
    if (current !== "prompt" || module === null) return current;
    return expoPermission(await module.requestTrackingPermissionsAsync());
  }

  /** Whether the OS lets this app refresh in the background; `null` when the app does not ship expo-background-task. */
  async backgroundRefresh(): Promise<PermissionStatus | null> {
    const module = this.modules.backgroundTask;
    if (module === null) return null;
    return (await module.getStatusAsync()) === BACKGROUND_AVAILABLE ? "granted" : "denied";
  }

  /** Opens this app's page in the OS settings. */
  openSettings(): Promise<void> {
    return Linking.openSettings();
  }
}
