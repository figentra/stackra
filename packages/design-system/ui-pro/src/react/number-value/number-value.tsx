/**
 * Stackra file contract:
 * Purpose: the web `NumberValue` compound on HeroUI Pro's NumberValue (a locale-formatted number that animates when
 *          it changes, drawn with `@number-flow/react`): the root and the parts Prefix and Suffix, with HeroUI Pro's
 *          own names.
 * Boundary: no vocabulary prop applies, so every prop passes through unchanged: the root's `style` there is the
 *          number style (`currency`, `percent`, ...), not a CSS style, and keeps HeroUI Pro's name. The compound
 *          exposes the documented parts: HeroUI Pro's `NumberValue.Root` is left out. Imports the `number-value`
 *          subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import {
  NumberValue as HeroNumberValue,
  type NumberValueRootProps as HeroNumberValueRootProps,
} from "@heroui-pro/react/number-value";

/** Props of the web NumberValue: HeroUI Pro's own root props, passed through unchanged. */
export type NumberValueProps = HeroNumberValueRootProps;

/** The root: HeroUI Pro's, which formats `value` for the locale and animates changes. */
function NumberValueRoot(props: NumberValueProps) {
  return <HeroNumberValue.Root {...props} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface NumberValueParts {
  /** Text or an element drawn before the number. */
  readonly Prefix: typeof HeroNumberValue.Prefix;
  /** Text or an element drawn after the number. */
  readonly Suffix: typeof HeroNumberValue.Suffix;
}

/** A formatted number: `NumberValue.Prefix`, the number from `value`, then `NumberValue.Suffix`. */
export const NumberValue: typeof NumberValueRoot & NumberValueParts = Object.assign(
  NumberValueRoot,
  {
    Prefix: HeroNumberValue.Prefix,
    Suffix: HeroNumberValue.Suffix,
  },
);
