/**
 * Stackra file contract:
 * Purpose: `FabAction`, one action a floating action button fans out when it opens (a speed dial).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** One action of a Fab's speed dial. */
export interface FabAction {
  /** The key `onAction` reports; unique within the Fab. */
  readonly id: string;
  /** The visible label beside the small button, which is also its accessible name. */
  readonly label: string;
  /** The icon of the small button. */
  readonly icon: IconSlot;
  /** Called when the action is chosen, before the Fab closes. */
  readonly onPress?: (() => void) | undefined;
}
