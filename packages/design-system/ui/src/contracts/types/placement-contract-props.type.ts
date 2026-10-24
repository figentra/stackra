/**
 * Stackra file contract:
 * Purpose: where an anchored overlay opens against its trigger: the side and the alignment along that side's edge.
 *          Popover, Tooltip and Menu extend it so one pair of words places any of them on web and native.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0060 (right-to-left).
 */
import type { PlacementAlign } from "#contracts/enums/placement-align.enum";
import type { Placement } from "#contracts/enums/placement.enum";

/** Props shared by every anchored overlay on web and native. */
export interface PlacementContractProps {
  /** The side of the trigger it opens on, by reading direction. The runtime flips it when there is no room. */
  readonly placement?: Placement | undefined;
  /** Where along that side it lines up with the trigger. Defaults to `center`. */
  readonly align?: PlacementAlign | undefined;
}
