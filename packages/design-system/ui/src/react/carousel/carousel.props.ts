/**
 * Stackra file contract:
 * Purpose: `CarouselProps`, the props of the web `Carousel`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { CarouselContractProps } from "#contracts/types/carousel-contract-props.type";

/** Props of the web Carousel. */
export type CarouselProps = CarouselContractProps & {
  readonly className?: string | undefined;
};
