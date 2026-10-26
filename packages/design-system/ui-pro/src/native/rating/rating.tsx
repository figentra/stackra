/**
 * Stackra file contract:
 * Purpose: the native `Rating` compound on HeroUI Native Pro's Rating (a radio group of stars or custom icons): the
 *          root maps `label` to `accessibilityLabel`; every other prop, `value`, `defaultValue`, `maxValue`, `size`,
 *          `isReadOnly` and `onValueChange` included, passes through. `Rating.Item` is HeroUI Native Pro's own.
 * Boundary: no behaviour or styling of its own. The compound exposes the one part of HeroUI Native Pro, its own
 *          component. HeroUI Native Pro's `useRating` hook is re-exported.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import { Rating as HeroRating } from "heroui-native-pro/rating";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { RatingProps } from "#native/rating/rating.props";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function RatingRoot({ label, ...rest }: RatingProps): ReactElement {
  return <HeroRating {...rest} {...omitUndefined({ accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface RatingParts {
  /** One selectable rating step, with its numeric `value`. */
  readonly Item: typeof HeroRating.Item;
}

/** A rating input: `Rating.Item` steps, each with its `value`. Name it for screen readers with `label`. */
export const Rating: typeof RatingRoot & RatingParts = Object.assign(RatingRoot, {
  Item: HeroRating.Item,
});

export { useRating } from "heroui-native-pro/rating";
