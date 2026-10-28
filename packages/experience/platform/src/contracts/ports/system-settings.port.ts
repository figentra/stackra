/**
 * Stackra file contract:
 * Purpose: the `SystemSettings` port: what the phone's own settings decide and the app follows (owner decision
 *          2026-10-29, follow the system): App Tracking Transparency, Low Power Mode, an expensive (metered or Low
 *          Data) connection and Background App Refresh, plus the deep link to this app's page in the OS settings
 *          where a refused permission is granted again.
 * Boundary: an abstract class that is its own token, keyed `platform.SystemSettings`; a driver per target implements it
 *           with `extends Driver(SystemSettings)` (memory, Expo). It only reads and links: the app offers no in-app
 *           override of any of these, the person changes them in the OS settings. `null` means the target has no such
 *           control at all (tracking on Android or the web), never "unknown".
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 2 and 3, 2026-10-29 note); ADR 0298 (2026-10-29 note: App Tracking
 *                     Transparency refuses marketing); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { ReadonlySignal } from "#contracts/types/readonly-signal.type";

/**
 * The phone's system-owned settings, read-only.
 *
 * @example
 * const settings = useContainer().get(SystemSettings);
 * const tracking = await settings.tracking();
 * ledger.setAppTrackingDenied(tracking !== null && tracking !== "granted");
 * if (settings.lowPowerMode.get()) pausePrefetch();
 */
export abstract class SystemSettings extends Port {
  /** Type-only port key, so `DriverName<SystemSettings>` narrows to this port's drivers. */
  declare readonly "~key": "platform.SystemSettings";

  /** True while the OS saves power (iOS Low Power Mode, Android Battery Saver); background work waits. */
  abstract readonly lowPowerMode: ReadonlySignal<boolean>;

  /** True while the connection is metered or the person asked to save data (Low Data Mode); large downloads wait. */
  abstract readonly expensiveNetwork: ReadonlySignal<boolean>;

  /** Where App Tracking Transparency stands; `null` where the OS has no such control (Android, the web). */
  abstract tracking(): Promise<PermissionStatus | null>;

  /** Shows the App Tracking Transparency prompt when it is not decided; resolves where it stands afterwards. */
  abstract requestTracking(): Promise<PermissionStatus | null>;

  /** Whether the OS lets this app refresh in the background; `null` where the OS has no such switch. */
  abstract backgroundRefresh(): Promise<PermissionStatus | null>;

  /** Opens this app's page in the OS settings, where a refused permission or a channel is changed. */
  abstract openSettings(): Promise<void>;
}
