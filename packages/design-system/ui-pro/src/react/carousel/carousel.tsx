/**
 * Stackra file contract:
 * Purpose: the web `Carousel` compound on HeroUI Pro's Carousel (an Embla slider): the root maps `label` to
 *          `aria-label`; every other prop, `opts`, `plugins`, `setApi` and `type` included, passes through. The parts
 *          Content, Item, Previous, Next, Dots, Thumbnails and Thumbnail are HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. Embla (`embla-carousel-react`)
 *          is an optional peer. The compound exposes the documented parts: HeroUI Pro's `Carousel.Root` is left out.
 *          Imports the `carousel` subpath, the only way to reach it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import {
  Carousel as HeroCarousel,
  type CarouselRootProps as HeroCarouselRootProps,
} from "@heroui-pro/react/carousel";

import type { CarouselContractProps } from "#contracts/types/carousel-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the web Carousel: the shared contract plus HeroUI Pro's own props, passed through unchanged. The accessible
 * name is `label`, so HeroUI Pro's `aria-label` is left out of the type.
 */
export type CarouselProps = CarouselContractProps &
  Omit<HeroCarouselRootProps, keyof CarouselContractProps | "aria-label">;

/** The root: HeroUI Pro's, a `region` that scrolls its slides, with `label` as its `aria-label`. */
function CarouselRoot({ label, ...rest }: CarouselProps) {
  return <HeroCarousel.Root {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface CarouselParts {
  /** The scrolling track that holds the items. */
  readonly Content: typeof HeroCarousel.Content;
  /** One slide. */
  readonly Item: typeof HeroCarousel.Item;
  /** The button that scrolls to the previous slide. */
  readonly Previous: typeof HeroCarousel.Previous;
  /** The button that scrolls to the next slide. */
  readonly Next: typeof HeroCarousel.Next;
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
  Dots: HeroCarousel.Dots,
  Thumbnails: HeroCarousel.Thumbnails,
  Thumbnail: HeroCarousel.Thumbnail,
});

export { useCarousel } from "@heroui-pro/react/carousel";
