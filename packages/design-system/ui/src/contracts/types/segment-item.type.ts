/**
 * Stackra file contract:
 * Purpose: `SegmentItem`, one choice of a SegmentedControl or MorphTabs: its key, words and optional icon.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** One choice of a SegmentedControl or a MorphTabs. */
export interface SegmentItem extends CollectionItem {
  /** The words; always the accessible name, even where only the icon shows. */
  readonly label: string;
  /** The icon, before the words. MorphTabs needs it: the unselected tabs show only their icon. */
  readonly icon?: IconSlot | undefined;
  /** True to show the choice but refuse it. */
  readonly isDisabled?: boolean | undefined;
}
