/**
 * Stackra file contract:
 * Purpose: the single-choice props a `SegmentedControl` and a `MorphTabs` share: the choices, the chosen key (controlled or not) and the group's name.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { SegmentItem } from "#contracts/types/segment-item.type";

/** The props of a row of exclusive choices with a sliding marker. */
export interface SegmentSelectionContractProps {
  /** The choices, in reading order. */
  readonly items: readonly SegmentItem[];
  /** The chosen key, for a controlled row; pair it with `onSelectionChange`. */
  readonly selectedKey?: string | undefined;
  /** The key chosen at the start, for an uncontrolled row. Defaults to the first item's. */
  readonly defaultSelectedKey?: string | undefined;
  /** Called with the new key each time the choice changes. */
  readonly onSelectionChange?: ((key: string) => void) | undefined;
  /** The spoken name of the group, for example "Order view". */
  readonly label: string;
  /** True to refuse every choice. */
  readonly isDisabled?: boolean | undefined;
}
