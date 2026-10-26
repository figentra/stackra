/**
 * Stackra file contract:
 * Purpose: the native `NumberPad` compound on HeroUI Native Pro's NumberPad (a grid of digit keys): the root maps
 *          `label` to `accessibilityLabel`; `value`, `onValueChange`, `maxLength`, `onComplete` and every other prop
 *          pass through.
 * Boundary: no behaviour or styling of its own. The compound exposes HeroUI Native Pro's own parts, and its
 *          `useNumberPad` hook is re-exported as it is.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */
import { NumberPad as HeroNumberPad } from "heroui-native-pro/number-pad";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { NumberPadProps } from "#native/number-pad/number-pad.props";

export { useNumberPad } from "heroui-native-pro/number-pad";

/** The root: HeroUI Native Pro's, with `label` as the accessibility label. */
function NumberPadRoot({ label, isDisabled, ...rest }: NumberPadProps): ReactElement {
  return <HeroNumberPad {...rest} {...omitUndefined({ isDisabled, accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface NumberPadParts {
  /** One row of keys. */
  readonly Row: typeof HeroNumberPad.Row;
  /** One digit key. */
  readonly Key: typeof HeroNumberPad.Key;
  /** The surface behind a key. */
  readonly KeyBackground: typeof HeroNumberPad.KeyBackground;
  /** The digit or text drawn on a key. */
  readonly KeyLabel: typeof HeroNumberPad.KeyLabel;
  /** The key that deletes the last digit. */
  readonly Backspace: typeof HeroNumberPad.Backspace;
  /** An empty cell that keeps the grid aligned. */
  readonly Spacer: typeof HeroNumberPad.Spacer;
}

/**
 * A grid of digit keys: `NumberPad.Row` holds `NumberPad.Key`, `NumberPad.Backspace` and `NumberPad.Spacer`. Name it
 * for screen readers with `label`.
 */
export const NumberPad: typeof NumberPadRoot & NumberPadParts = Object.assign(NumberPadRoot, {
  Row: HeroNumberPad.Row,
  Key: HeroNumberPad.Key,
  KeyBackground: HeroNumberPad.KeyBackground,
  KeyLabel: HeroNumberPad.KeyLabel,
  Backspace: HeroNumberPad.Backspace,
  Spacer: HeroNumberPad.Spacer,
});
