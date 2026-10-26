/**
 * Stackra file contract:
 * Purpose: `HoloCardProps`, props of the web HoloCard: the shared contract plus HeroUI Pro's own card props, passed
 *          through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { HoloCardRootProps } from "@heroui-pro/react/holo-card";

import type { HoloCardContractProps } from "#contracts/types/holo-card-contract-props.type";

/** Props of the web HoloCard: the shared contract plus HeroUI Pro's own card props, passed through unchanged. */
export type HoloCardProps = HoloCardContractProps &
  Omit<HoloCardRootProps, keyof HoloCardContractProps>;
