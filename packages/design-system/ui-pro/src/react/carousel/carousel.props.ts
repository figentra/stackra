/**
 * Stackra file contract:
 * Purpose: `CarouselProps`, props of the web Carousel: the shared contract plus HeroUI Pro's own props, passed through
 *          unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { CarouselRootProps as HeroCarouselRootProps } from "@heroui-pro/react/carousel";

import type { CarouselContractProps } from "#contracts/types/carousel-contract-props.type";

/**
 * Props of the web Carousel: the shared contract plus HeroUI Pro's own props, passed through unchanged. The accessible
 * name is `label`, so HeroUI Pro's `aria-label` is left out of the type.
 */
export type CarouselProps = CarouselContractProps &
  Omit<HeroCarouselRootProps, keyof CarouselContractProps | "aria-label">;
