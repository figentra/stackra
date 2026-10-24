/**
 * Stackra file contract:
 * Purpose: `BadgeCapability`, the `badge` facet: the count on the installed app's icon (the Badging API, the dock or
 *          taskbar badge).
 * Boundary: a type only; refuses with `unavailable` where the app icon takes no badge (a browser tab).
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 2 and 3); ADR 0281 (decision 2: badges on PWA and desktop).
 */
import type { CapabilityResult } from "#contracts/types/capability-result.type";

/** The app icon badge. */
export interface BadgeCapability {
  /** Shows `count` on the app icon; zero clears it. */
  set(count: number): Promise<CapabilityResult>;

  /** Removes the badge. */
  clear(): Promise<CapabilityResult>;
}
