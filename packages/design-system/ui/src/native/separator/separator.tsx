/**
 * Stackra file contract:
 * Purpose: the native `Separator` on HeroUI Native's Separator: the contract's colour level painted with the theme
 *          colour (`SEPARATOR_COLOR`, `useThemeColor`), HeroUI Native's hairline by default, `thickness` passed
 *          through.
 * Boundary: no styling beyond the background colour. HeroUI Native's own `variant` means thickness (`thin`, `thick`),
 *          so the contract's `variant` is never passed on; `thickness={6}` is its `thick`. The colour is an inline
 *          style because HeroUI Native's component CSS is unlayered, so a utility class has no guaranteed precedence.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0304.
 */
import { Separator as HeroSeparator, useThemeColor, type ThemeColor } from "heroui-native";
import type { ComponentPropsWithRef } from "react";

import type { SeparatorVariant } from "#contracts/enums/separator-variant.enum";
import type { SeparatorContractProps } from "#contracts/types/separator-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the native Separator: the shared contract plus HeroUI Native's own separator props, passed through. */
export type SeparatorProps = SeparatorContractProps &
  Omit<ComponentPropsWithRef<typeof HeroSeparator>, keyof SeparatorContractProps>;

/**
 * The theme colour of each separator level; typed over every level so a new one fails to compile until it has a
 * colour.
 */
const SEPARATOR_COLOR: Readonly<Record<SeparatorVariant, ThemeColor>> = Object.freeze({
  default: "separator",
  secondary: "separator-secondary",
  tertiary: "separator-tertiary",
});

/**
 * A rule between two groups, a hairline unless `thickness` says otherwise. Pass `variant` to match the surface it
 * sits on: the rule does not read the level from the surface around it. Screen readers skip it, the platform
 * convention for a rule.
 */
export function Separator({ variant = "default", orientation, style, ...rest }: SeparatorProps) {
  const backgroundColor = useThemeColor(SEPARATOR_COLOR[variant]);
  // The caller's style comes after ours, so a caller can still override the colour.
  return (
    <HeroSeparator
      {...rest}
      {...omitUndefined({ orientation })}
      style={[{ backgroundColor }, style]}
    />
  );
}
