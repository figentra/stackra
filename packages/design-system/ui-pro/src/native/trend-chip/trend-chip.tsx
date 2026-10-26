/**
 * Stackra file contract:
 * Purpose: the native `TrendChip` compound on HeroUI Native Pro's TrendChip (a chip that shows a change and its
 *          direction): the root takes the shared `size` and the `TrendChipVariant` variant, as the web `TrendChip`
 *          does, and the parts Indicator, Value, Prefix and Suffix are HeroUI Native Pro's own; the `trend`
 *          direction and every other prop pass through.
 * Boundary: no behaviour or styling of its own. The compound exposes the parts of HeroUI Native Pro, its own
 *          components. HeroUI Native Pro's `useTrendChip` hook is re-exported.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import { TrendChip as HeroTrendChip } from "heroui-native-pro/trend-chip";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { TrendChipProps } from "#native/trend-chip/trend-chip.props";

/** The root: HeroUI Native Pro's, which draws the arrow and the colour from `trend`. */
function TrendChipRoot({ size, variant, ...rest }: TrendChipProps): ReactElement {
  return <HeroTrendChip {...rest} {...omitUndefined({ size, variant })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface TrendChipParts {
  /** A custom arrow icon; HeroUI Native Pro draws a directional arrow from `trend` when it is left out. */
  readonly Indicator: typeof HeroTrendChip.Indicator;
  /** The change itself, such as `4%`. */
  readonly Value: typeof HeroTrendChip.Value;
  /** Text before the value. */
  readonly Prefix: typeof HeroTrendChip.Prefix;
  /** Text after the value. */
  readonly Suffix: typeof HeroTrendChip.Suffix;
}

/** A chip that shows a change and its direction: `TrendChip.Prefix`, `TrendChip.Value`, `TrendChip.Suffix`. */
export const TrendChip: typeof TrendChipRoot & TrendChipParts = Object.assign(TrendChipRoot, {
  Indicator: HeroTrendChip.Indicator,
  Value: HeroTrendChip.Value,
  Prefix: HeroTrendChip.Prefix,
  Suffix: HeroTrendChip.Suffix,
});

export { useTrendChip } from "heroui-native-pro/trend-chip";
