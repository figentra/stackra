/**
 * Stackra file contract:
 * Purpose: `CAPABILITY_FACETS`, each facet of the `Platform` port with the capability code it stands for, so
 *          `useCapability("scanner")` asks `platform.has(PlatformCapability.Scanner)` before it hands the facet out.
 * Boundary: internal data; not exported from the entry. A new facet on the port adds its row here.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 2 and 3).
 */
import { PlatformCapability } from "#core/enums/platform-capability.enum";

/** Facet name to capability code. */
export const CAPABILITY_FACETS = Object.freeze({
  network: PlatformCapability.Network,
  notifications: PlatformCapability.LocalNotifications,
  scanner: PlatformCapability.Scanner,
  fileHandling: PlatformCapability.FileHandling,
  shareTarget: PlatformCapability.ShareTarget,
  badge: PlatformCapability.Badge,
  share: PlatformCapability.Share,
  haptics: PlatformCapability.Haptics,
  install: PlatformCapability.InstallPrompt,
} as const);
