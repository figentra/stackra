/**
 * Stackra file contract:
 * Purpose: `CarouselProps`, props of the native Carousel: the shared contract plus HeroUI Native Pro's own props,
 *          passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import type { Carousel as HeroCarousel } from "heroui-native-pro/carousel";
import type { ComponentPropsWithRef } from "react";

import type { CarouselContractProps } from "#contracts/types/carousel-contract-props.type";

/**
 * Props of the native Carousel: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type CarouselProps = CarouselContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroCarousel>,
    keyof CarouselContractProps | "accessibilityLabel" | "aria-label"
  >;
