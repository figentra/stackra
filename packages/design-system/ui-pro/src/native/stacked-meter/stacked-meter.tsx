/**
 * Stackra file contract:
 * Purpose: the native `StackedMeter` compound on HeroUI Native Pro's StackedMeter (a track split into coloured
 *          segments with a legend): the root maps `label` to `accessibilityLabel`; every other prop, `segments`,
 *          `maxValue`, `formatOptions` and `animation` included, passes through.
 * Boundary: no behaviour or styling of its own. The compound exposes the nine parts of HeroUI Native Pro, its own
 *          components. A segment's `color` variant stays HeroUI's: it adds the chart palette to the tones, so it is
 *          not the `tone` role. Its hooks stay in `heroui-native-pro/stacked-meter`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-006.
 */
import { StackedMeter as HeroStackedMeter } from "heroui-native-pro/stacked-meter";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { StackedMeterProps } from "#native/stacked-meter/stacked-meter.props";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function StackedMeterRoot({ label, size, isDisabled, ...rest }: StackedMeterProps): ReactElement {
  return (
    <HeroStackedMeter
      {...rest}
      {...omitUndefined({ size, isDisabled, accessibilityLabel: label })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface StackedMeterParts {
  /** The title text describing the meter. */
  readonly Label: typeof HeroStackedMeter.Label;
  /** The container that holds the segments. */
  readonly Track: typeof HeroStackedMeter.Track;
  /** The theme-aware background behind the empty remainder of the track. */
  readonly TrackBackground: typeof HeroStackedMeter.TrackBackground;
  /** The animated element for one segment's share. */
  readonly Segment: typeof HeroStackedMeter.Segment;
  /** The wrapping row of legend items. */
  readonly Legend: typeof HeroStackedMeter.Legend;
  /** The row that describes one segment. */
  readonly LegendItem: typeof HeroStackedMeter.LegendItem;
  /** The dot painted in the segment's colour. */
  readonly LegendIndicator: typeof HeroStackedMeter.LegendIndicator;
  /** The segment's name text. */
  readonly LegendLabel: typeof HeroStackedMeter.LegendLabel;
  /** The segment's formatted value text. */
  readonly LegendValue: typeof HeroStackedMeter.LegendValue;
}

/**
 * A stacked meter: pass `segments`, then `StackedMeter.Label`, `StackedMeter.Track` and `StackedMeter.Legend` as
 * children, or none to get the track and legend. Name it for screen readers with `label`.
 */
export const StackedMeter: typeof StackedMeterRoot & StackedMeterParts = Object.assign(
  StackedMeterRoot,
  {
    Label: HeroStackedMeter.Label,
    Track: HeroStackedMeter.Track,
    TrackBackground: HeroStackedMeter.TrackBackground,
    Segment: HeroStackedMeter.Segment,
    Legend: HeroStackedMeter.Legend,
    LegendItem: HeroStackedMeter.LegendItem,
    LegendIndicator: HeroStackedMeter.LegendIndicator,
    LegendLabel: HeroStackedMeter.LegendLabel,
    LegendValue: HeroStackedMeter.LegendValue,
  },
);
