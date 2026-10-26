/**
 * Stackra file contract:
 * Purpose: `TrendChipProps`, props of the native TrendChip: the shared contract plus HeroUI Native Pro's own chip
 *          props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import type { TrendChip as HeroTrendChip } from "heroui-native-pro/trend-chip";
import type { ComponentPropsWithRef } from "react";

import type { TrendChipContractProps } from "#contracts/types/trend-chip-contract-props.type";

/** Props of the native TrendChip: the shared contract plus HeroUI Native Pro's own chip props, passed through unchanged. */
export type TrendChipProps = TrendChipContractProps &
  Omit<ComponentPropsWithRef<typeof HeroTrendChip>, keyof TrendChipContractProps>;
