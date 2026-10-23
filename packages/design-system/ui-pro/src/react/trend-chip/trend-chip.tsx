/**
 * Stackra file contract:
 * Purpose: the web `TrendChip` compound on HeroUI Pro's TrendChip: the root with the shared `size` and the
 *          `TrendChipVariant` variant, and the parts Indicator, Prefix and Suffix; the `trend` direction and every
 *          other prop pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `TrendChip.Root` is left out. Imports the `trend-chip` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-403 FR-007.
 */
import {
  TrendChip as HeroTrendChip,
  type TrendChipProps as HeroTrendChipProps,
} from "@heroui-pro/react/trend-chip";

import type { TrendChipContractProps } from "#contracts/types/trend-chip-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web TrendChip: the shared contract plus HeroUI Pro's own chip props, passed through unchanged. */
export type TrendChipProps = TrendChipContractProps &
  Omit<HeroTrendChipProps, keyof TrendChipContractProps>;

/** The chip root: HeroUI Pro's, which draws the arrow and the colour from `trend`. */
function TrendChipRoot({ size, variant, ...rest }: TrendChipProps) {
  return <HeroTrendChip.Root {...rest} {...omitUndefined({ size, variant })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface TrendChipParts {
  /** A custom arrow icon; HeroUI Pro draws a directional arrow from `trend` when it is left out. */
  readonly Indicator: typeof HeroTrendChip.Indicator;
  /** Text or an element before the value. */
  readonly Prefix: typeof HeroTrendChip.Prefix;
  /** Text or an element after the value. */
  readonly Suffix: typeof HeroTrendChip.Suffix;
}

/** A chip that shows a change and its direction: `TrendChip.Prefix`, the value, `TrendChip.Suffix`. */
export const TrendChip: typeof TrendChipRoot & TrendChipParts = Object.assign(TrendChipRoot, {
  Indicator: HeroTrendChip.Indicator,
  Prefix: HeroTrendChip.Prefix,
  Suffix: HeroTrendChip.Suffix,
});
