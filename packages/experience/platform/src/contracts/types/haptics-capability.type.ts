/**
 * Stackra file contract:
 * Purpose: `HapticsCapability`, the `haptics` facet: a short tap of feedback on a press, a success or an error.
 * Boundary: a type only; refuses with `unavailable` where the device has no vibration motor or API.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 2 and 3).
 */
import type { CapabilityResult } from "#contracts/types/capability-result.type";

/** The touch feedback capability. */
export interface HapticsCapability {
  /** One tap of feedback; `heavy` is longer than `light`. */
  impact(strength?: "light" | "medium" | "heavy"): Promise<CapabilityResult>;
}
