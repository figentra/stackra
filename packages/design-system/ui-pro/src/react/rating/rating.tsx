/**
 * Stackra file contract:
 * Purpose: the web `Rating` compound on HeroUI Pro's Rating (a radio group of stars or custom icons): the root maps
 *          `label` to `aria-label`; every other prop, `value`, `defaultValue`, `size`, `isReadOnly` and
 *          `onValueChange` included, passes through. `Rating.Item` is HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented part: HeroUI Pro's `Rating.Root` is left out. `Rating.Item` stays HeroUI Pro's own because the
 *          root reads its items through the radio group context, not by type, so a wrapper would add nothing.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import {
  Rating as HeroRating,
  type RatingRootProps as HeroRatingRootProps,
} from "@heroui-pro/react/rating";

import type { RatingContractProps } from "#contracts/types/rating-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the web Rating: the shared contract plus HeroUI Pro's own props, passed through unchanged. The accessible
 * name is `label`, so HeroUI Pro's `aria-label` is left out of the type.
 */
export type RatingProps = RatingContractProps &
  Omit<HeroRatingRootProps, keyof RatingContractProps | "aria-label">;

/** The root: HeroUI Pro's, a radio group of rating items, with `label` as its `aria-label`. */
function RatingRoot({ label, ...rest }: RatingProps) {
  return <HeroRating.Root {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface RatingParts {
  /** One selectable rating step, with its numeric `value`. */
  readonly Item: typeof HeroRating.Item;
}

/** A rating input: `Rating.Item` steps, each with its `value`. Name it for screen readers with `label`. */
export const Rating: typeof RatingRoot & RatingParts = Object.assign(RatingRoot, {
  Item: HeroRating.Item,
});
