/**
 * Stackra file contract:
 * Purpose: `CarouselProps`, the props of the native `Carousel`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { CarouselContractProps } from "#contracts/types/carousel-contract-props.type";

/** Props of the native Carousel. */
export type CarouselProps = CarouselContractProps & {
  readonly className?: string | undefined;
};
