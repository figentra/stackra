/**
 * Stackra file contract:
 * Purpose: `LaunchGate`, whether one product may sell under one resolved market: every layer live, every launch
 *          checklist item for the product done, and every entry signed off by a reviewer.
 * Boundary: a type only; `launchGate` builds it. Packs are named `market@version` (`market/section@version` for a
 *           section); items and keys are prefixed with that name and a colon.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 8).
 */

/** The launch gate of one product in one market. */
export type LaunchGate = {
  /** True when the three lists are empty. */
  readonly ready: boolean;
  /** Layers whose status is not `live`. */
  readonly notLive: readonly string[];
  /** Checklist items for the product not done yet. */
  readonly pending: readonly string[];
  /** Entry keys with no reviewer sign-off in their pack version. */
  readonly unreviewed: readonly string[];
};
