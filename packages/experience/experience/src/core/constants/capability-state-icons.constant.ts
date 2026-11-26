/**
 * Stackra file contract:
 * Purpose: `CAPABILITY_STATE_ICONS`, the icon drawn beside each capability state's word in a capability matrix.
 * Boundary: data only; each value is a Lucide name `@stackra/ui` checks as an `IconName`. The stand-in for gen's
 *           generated `Icons` constant (R-56), as `LANDING_BLOCK_ICONS` is.
 * Runtime: isomorphic
 * Governing contract: ADR 0309 (icons by name); ADR 0322 (generated constants); owner decision R-56; STA-2041.
 */
import type { IconName } from "@stackra/icons/contracts";

import type { CapabilityState } from "#core/enums/capability-state.enum";

/** One icon per state. */
export const CAPABILITY_STATE_ICONS = Object.freeze({
  yes: "check",
  no: "minus",
  coming: "clock",
} as const satisfies Readonly<Record<CapabilityState, IconName>>);
