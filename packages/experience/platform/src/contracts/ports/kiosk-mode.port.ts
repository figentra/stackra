/**
 * Stackra file contract:
 * Purpose: the `KioskMode` port: locks the app to its own windows for a till or a self-service kiosk (a full-screen
 *          kiosk window, no menu, no developer tools in a packaged build, overlays and global shortcuts off) and
 *          releases it, each as a `CapabilityResult` that refuses with capability `window` where the target cannot.
 * Boundary: an abstract class that is its own token, keyed `platform.KioskMode`. Whether a till runs in kiosk mode is
 *           a tenant setting (`kiosk-mode`), never code; this port is the mechanism. Global shortcuts given up on
 *           entry come back with the next launch.
 * Runtime: isomorphic
 * Governing contract: ADR 0281 (STA-469 note: the kiosk launch mode); ADR 0344; ADR 0250 (decision 3); ADR 0294
 *                     (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { CapabilityResult } from "#contracts/types/capability-result.type";

/**
 * Kiosk mode.
 *
 * @example
 * if (settings.kioskMode) await kiosk.enter();
 */
export abstract class KioskMode extends Port {
  /** Type-only port key, so `DriverName<KioskMode>` narrows to this port's drivers. */
  declare readonly "~key": "platform.KioskMode";

  /** Whether the target can enter kiosk mode. */
  abstract probe(): Promise<CapabilityResult>;

  /** Locks every window, now and later, into kiosk mode. */
  abstract enter(): Promise<CapabilityResult>;

  /** Releases kiosk mode. */
  abstract exit(): Promise<CapabilityResult>;

  /** Whether kiosk mode is on. */
  abstract isActive(): Promise<boolean>;
}
