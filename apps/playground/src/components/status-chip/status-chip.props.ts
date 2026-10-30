/**
 * Stackra file contract:
 * Purpose: `StatusChipProps`: props of `StatusChip`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ComponentStatus } from "@stackra/showcase";

/** Props of {@link StatusChip}. */
export interface StatusChipProps {
  /** The entry's status; nothing is drawn without one. */
  status?: ComponentStatus | undefined;
  /** True to read a missing status as "Stable" (doc pages); cards leave it out. */
  showStable?: boolean | undefined;
}
