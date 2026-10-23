/**
 * Stackra file contract:
 * Purpose: the props the web `TrendChip` takes from the shared vocabulary: its size and its emphasis variant.
 * Boundary: types only; web only. The trend direction and every other prop are HeroUI Pro's own and pass through.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */
import type { Size } from "@stackra/ui/contracts";

import type { TrendChipVariant } from "#contracts/enums/trend-chip-variant.enum";

/** Props of `TrendChip` that the Stackra vocabulary names. */
export interface TrendChipContractProps {
  /** The height and text size. Defaults to `sm`. */
  readonly size?: Size | undefined;
  /** The emphasis of the chip. Defaults to `soft`. */
  readonly variant?: TrendChipVariant | undefined;
}
