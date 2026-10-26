/**
 * Stackra file contract:
 * Purpose: `RatingProps`, props of the web Rating: the shared contract plus HeroUI Pro's own props, passed through
 *          unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { RatingRootProps as HeroRatingRootProps } from "@heroui-pro/react/rating";

import type { RatingContractProps } from "#contracts/types/rating-contract-props.type";

/**
 * Props of the web Rating: the shared contract plus HeroUI Pro's own props, passed through unchanged. The accessible
 * name is `label`, so HeroUI Pro's `aria-label` is left out of the type.
 */
export type RatingProps = RatingContractProps &
  Omit<HeroRatingRootProps, keyof RatingContractProps | "aria-label">;
