/**
 * Stackra file contract:
 * Purpose: the native `ProgressBar` compound on HeroUI Native Pro's ProgressBar (a horizontal bar that fills to a
 *          value): the root maps `tone` to HeroUI's `color` and `label` to `accessibilityLabel`; every other prop,
 *          `value`, `minValue`, `maxValue`, `isIndeterminate`, `isDisabled`, `size` and `formatOptions` included,
 *          passes through. The parts Track, TrackBackground, Fill, Label and ValueLabel are HeroUI Native Pro's own.
 * Boundary: no behaviour or styling of its own. The compound exposes the parts of HeroUI Native Pro, its own
 *          components. HeroUI Native Pro's `useProgressBar` hook is re-exported.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import { ProgressBar as HeroProgressBar } from "heroui-native-pro/progress-bar";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { ProgressBarContractProps } from "#contracts/types/progress-bar-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the native ProgressBar: the shared contract plus HeroUI Native Pro's own props, passed through unchanged.
 * The colour role is `tone` and the accessible name is `label`, so HeroUI's names for them are left out of the type.
 */
export type ProgressBarProps = ProgressBarContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroProgressBar>,
    keyof ProgressBarContractProps | "color" | "accessibilityLabel" | "aria-label"
  >;

/** The root: HeroUI Native Pro's, with `tone` as its `color` and `label` as the accessibility label. */
function ProgressBarRoot({ tone, label, ...rest }: ProgressBarProps): ReactElement {
  return (
    <HeroProgressBar {...rest} {...omitUndefined({ color: tone, accessibilityLabel: label })} />
  );
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface ProgressBarParts {
  /** The track that holds the fill. */
  readonly Track: typeof HeroProgressBar.Track;
  /** A custom background layer for the track. */
  readonly TrackBackground: typeof HeroProgressBar.TrackBackground;
  /** The filled part of the track. */
  readonly Fill: typeof HeroProgressBar.Fill;
  /** The text that names what is progressing. */
  readonly Label: typeof HeroProgressBar.Label;
  /** The text that shows the formatted value. */
  readonly ValueLabel: typeof HeroProgressBar.ValueLabel;
}

/**
 * A progress bar: `ProgressBar.Track` holds `ProgressBar.Fill`, with an optional `Label` and `ValueLabel`. Name it for
 * screen readers with `label` when there is no visible label.
 */
export const ProgressBar: typeof ProgressBarRoot & ProgressBarParts = Object.assign(
  ProgressBarRoot,
  {
    Track: HeroProgressBar.Track,
    TrackBackground: HeroProgressBar.TrackBackground,
    Fill: HeroProgressBar.Fill,
    Label: HeroProgressBar.Label,
    ValueLabel: HeroProgressBar.ValueLabel,
  },
);

export { useProgressBar } from "heroui-native-pro/progress-bar";
