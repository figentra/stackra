/**
 * Stackra file contract:
 * Purpose: the native `NumberValue` compound on HeroUI Native Pro's NumberValue (a locale-formatted number): the
 *          root and the parts Value, Prefix and Suffix, with HeroUI Native Pro's own names; `useNumberValue` reads the
 *          formatted string. HeroUI Native Pro draws the number still, with no animation to turn on (ADR 0329).
 * Boundary: no vocabulary prop applies, so every prop passes through unchanged: the number style is `numberStyle`
 *          here (the web `style`), because React Native's `style` is the view style. The compound exposes the parts
 *          of HeroUI Native Pro, its own components.
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import { NumberValue as HeroNumberValue } from "heroui-native-pro/number-value";
import type { ComponentPropsWithRef, ReactElement } from "react";

/** Props of the native NumberValue: HeroUI Native Pro's own root props, passed through unchanged. */
export type NumberValueProps = ComponentPropsWithRef<typeof HeroNumberValue>;

/** The root: HeroUI Native Pro's, which formats `value` for the locale. */
function NumberValueRoot(props: NumberValueProps): ReactElement {
  return <HeroNumberValue {...props} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface NumberValueParts {
  /** The formatted number, drawn when the root has no children. */
  readonly Value: typeof HeroNumberValue.Value;
  /** Text drawn before the number. */
  readonly Prefix: typeof HeroNumberValue.Prefix;
  /** Text drawn after the number. */
  readonly Suffix: typeof HeroNumberValue.Suffix;
}

/** A formatted number: `NumberValue.Prefix`, `NumberValue.Value`, then `NumberValue.Suffix`. */
export const NumberValue: typeof NumberValueRoot & NumberValueParts = Object.assign(
  NumberValueRoot,
  {
    Value: HeroNumberValue.Value,
    Prefix: HeroNumberValue.Prefix,
    Suffix: HeroNumberValue.Suffix,
  },
);

export { useNumberValue } from "heroui-native-pro/number-value";
