/**
 * Stackra file contract:
 * Purpose: the `Platform` port: what the running target offers (ADR 0250). `has(capability)` answers whether the
 *          target offers a capability at all; each facet (`network`, `notifications`, `scanner`, ...) is one
 *          capability, and a call the target or device cannot honour resolves a typed refusal instead of throwing.
 * Boundary: an abstract class that is its own token, keyed `platform.Platform`; a driver per target implements it
 *           with `extends Driver(Platform)` (memory, web, Electron). This leaf entry imports nothing else from the
 *           package, so `has` takes a capability code as a string: a `PlatformCapability` value from `.` is one.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 1 to 3); ADR 0281 (decision 2: the capability matrix); ADR 0294 (decisions
 *                     15, 16 and 17); registry A3 (`Platform` from `./contracts` only).
 */
import { Port } from "@stackra/contracts";

import type { BadgeCapability } from "#contracts/types/badge-capability.type";
import type { FileHandlingCapability } from "#contracts/types/file-handling-capability.type";
import type { HapticsCapability } from "#contracts/types/haptics-capability.type";
import type { InstallCapability } from "#contracts/types/install-capability.type";
import type { NetworkCapability } from "#contracts/types/network-capability.type";
import type { NotificationsCapability } from "#contracts/types/notifications-capability.type";
import type { ScannerCapability } from "#contracts/types/scanner-capability.type";
import type { ShareCapability } from "#contracts/types/share-capability.type";
import type { ShareTargetCapability } from "#contracts/types/share-target-capability.type";

/**
 * The capabilities of the running target.
 *
 * @example
 * const platform = useContainer().get(Platform);
 * if (platform.has(PlatformCapability.LocalNotifications)) await platform.notifications.requestPermission();
 * const isOnline = useSignal(platform.network.isOnline);
 */
export abstract class Platform extends Port {
  /** Type-only port key, so `DriverName<Platform>` narrows to this port's drivers. */
  declare readonly "~key": "platform.Platform";

  /** Online state (capability `network`). */
  abstract readonly network: NetworkCapability;

  /** Local notifications (capability `local_notifications`). */
  abstract readonly notifications: NotificationsCapability;

  /** The barcode scanner (capability `scanner`). */
  abstract readonly scanner: ScannerCapability;

  /** Files opened with the app (capability `file_handling`). */
  abstract readonly fileHandling: FileHandlingCapability;

  /** The PWA share inbox (capability `share_target`). */
  abstract readonly shareTarget: ShareTargetCapability;

  /** The app icon badge (capability `badge`). */
  abstract readonly badge: BadgeCapability;

  /** The system share sheet (capability `share`). */
  abstract readonly share: ShareCapability;

  /** Touch feedback (capability `haptics`). */
  abstract readonly haptics: HapticsCapability;

  /** The install prompt (capability `install_prompt`). */
  abstract readonly install: InstallCapability;

  /** Whether the target offers `capability` (a `PlatformCapability` code) at all; a device may still lack it at run time. */
  abstract has(capability: string): boolean;
}
