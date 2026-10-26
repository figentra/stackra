/**
 * Stackra file contract:
 * Purpose: `TrendChipProps`, props of the web TrendChip: the shared contract plus HeroUI Pro's own chip props, passed
 *          through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */
import type { TrendChipProps as HeroTrendChipProps } from "@heroui-pro/react/trend-chip";

import type { TrendChipContractProps } from "#contracts/types/trend-chip-contract-props.type";

/** Props of the web TrendChip: the shared contract plus HeroUI Pro's own chip props, passed through unchanged. */
export type TrendChipProps = TrendChipContractProps &
  Omit<HeroTrendChipProps, keyof TrendChipContractProps>;
