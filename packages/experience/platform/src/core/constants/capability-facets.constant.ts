/**
 * Stackra file contract:
 * Purpose: `CAPABILITY_FACETS`, each facet of the `Platform` port with the capability code it stands for, so
 *          `useCapability("scanner")` asks `platform.has(Capability.Scanner)` before it hands the facet out.
 * Boundary: internal data; not exported from the entry. A new facet on the port adds its row here.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 2 and 3).
 */
import { Capability } from "#core/enums/capability.enum";

/** Facet name to capability code. */
export const CAPABILITY_FACETS = Object.freeze({
  network: Capability.Network,
  notifications: Capability.LocalNotifications,
  scanner: Capability.Scanner,
  fileHandling: Capability.FileHandling,
  shareTarget: Capability.ShareTarget,
  badge: Capability.Badge,
  share: Capability.Share,
  haptics: Capability.Haptics,
  install: Capability.InstallPrompt,
} as const);
