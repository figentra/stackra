/**
 * Stackra file contract:
 * Purpose: the native `Carousel` compound on HeroUI Native Pro's Carousel (a horizontal snap pager on a
 *          `FlatList`): the root maps `label` to `accessibilityLabel`; every other prop, `itemsPerView`, `gap`,
 *          `type`, `autoPlay` and `onSelectedIndexChange` included, passes through. The parts Content, Item,
 *          Previous, Next, NavButtonBackground, Dots, Thumbnails and Thumbnail are HeroUI Native Pro's own.
 * Boundary: no behaviour or styling of its own. The compound exposes the parts of HeroUI Native Pro, its own
 *          components. HeroUI Native Pro's `useCarousel` hook is re-exported.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import { Carousel as HeroCarousel } from "heroui-native-pro/carousel";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { CarouselContractProps } from "#contracts/types/carousel-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native Carousel: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The accessible name is `label`, so HeroUI's two spellings of it are left out of the type.
 */
export type CarouselProps = CarouselContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroCarousel>,
    keyof CarouselContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function CarouselRoot({ label, ...rest }: CarouselProps): ReactElement {
  return <HeroCarousel {...rest} {...omitUndefined({ accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface CarouselParts {
  /** The scrolling track that holds the items. */
  readonly Content: typeof HeroCarousel.Content;
  /** One slide. */
  readonly Item: typeof HeroCarousel.Item;
  /** The button that scrolls to the previous slide. */
  readonly Previous: typeof HeroCarousel.Previous;
  /** The button that scrolls to the next slide. */
  readonly Next: typeof HeroCarousel.Next;
  /** A custom background layer for a navigation button. */
  readonly NavButtonBackground: typeof HeroCarousel.NavButtonBackground;
  /** The row of dots, one per slide. */
  readonly Dots: typeof HeroCarousel.Dots;
  /** The strip of thumbnails for the `miniatures` type. */
  readonly Thumbnails: typeof HeroCarousel.Thumbnails;
  /** One thumbnail that scrolls to its slide. */
  readonly Thumbnail: typeof HeroCarousel.Thumbnail;
}

/**
 * A slider: `Carousel.Content` holds `Carousel.Item` slides, with `Carousel.Previous`, `Carousel.Next`,
 * `Carousel.Dots` or `Carousel.Thumbnails` to move between them. Name it for screen readers with `label`.
 */
export const Carousel: typeof CarouselRoot & CarouselParts = Object.assign(CarouselRoot, {
  Content: HeroCarousel.Content,
  Item: HeroCarousel.Item,
  Previous: HeroCarousel.Previous,
  Next: HeroCarousel.Next,
  NavButtonBackground: HeroCarousel.NavButtonBackground,
  Dots: HeroCarousel.Dots,
  Thumbnails: HeroCarousel.Thumbnails,
  Thumbnail: HeroCarousel.Thumbnail,
});

export { useCarousel } from "heroui-native-pro/carousel";
