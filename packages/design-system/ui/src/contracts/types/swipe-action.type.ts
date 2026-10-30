/**
 * Stackra file contract:
 * Purpose: `SwipeAction`, one action a SwipeableRow reveals under the row (archive, delete).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { Tone } from "@stackra/contracts";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** One action under a SwipeableRow. */
export interface SwipeAction extends CollectionItem {
  /** The words under the icon, which are also the accessible name. */
  readonly label: string;
  /** The icon drawn above the label. */
  readonly icon?: IconSlot | undefined;
  /** The fill colour. Defaults to `default`. */
  readonly tone?: Tone | undefined;
  /** Called when the action is chosen, before the row closes. */
  readonly onPress?: (() => void) | undefined;
}
