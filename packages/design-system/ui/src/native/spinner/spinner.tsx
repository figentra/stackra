/**
 * Stackra file contract:
 * Purpose: the native `Spinner` on HeroUI Native: maps the shared contract (`tone` to the resolved theme colour
 *          through `useThemeColor`, `label` to `accessibilityLabel`, or hidden from VoiceOver and TalkBack when there
 *          is none) and passes every other HeroUI Native prop through unchanged, its enter and exit animation
 *          included.
 * Boundary: no styling of its own; reduced motion is HeroUI Native's global animation setting.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0304; ADR 0165 (HeroUI Native on native);
 *          owner decision 6 of STA-350 (thin wrappers).
 */
import type { ReactElement } from "react";
import { Spinner as HeroSpinner, useThemeColor } from "heroui-native";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { SpinnerProps } from "#native/spinner/spinner.props";

/** The props of a decorative spinner: hidden from VoiceOver and TalkBack alike. */
const HIDDEN = Object.freeze({
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const);

/**
 * An indeterminate wait. With a `label` it is one named, busy progress element; without one it is decoration and
 * hidden from assistive technology, so the text beside it must say what is loading.
 */
export function Spinner({ size, tone = "accent", label, ...rest }: SpinnerProps): ReactElement {
  // Called on every render so the hook order is stable, and so a change of colour scheme redraws the spinner.
  const color = useThemeColor(tone === "default" ? "foreground" : tone);
  return (
    <HeroSpinner
      {...rest}
      {...omitUndefined({ size })}
      color={color}
      {...(label ? { accessibilityLabel: label } : HIDDEN)}
    />
  );
}
