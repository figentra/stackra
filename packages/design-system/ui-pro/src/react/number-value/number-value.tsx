/**
 * Stackra file contract:
 * Purpose: the web `NumberValue` compound on HeroUI Pro's NumberValue (a locale-formatted number): the root and the
 *          parts Prefix and Suffix, with HeroUI Pro's own names. The number rolls to a new value with
 *          `@number-flow/react` on the theme's reveal step (ADR 0329), unless `isAnimated` is off; NumberFlow keeps
 *          it still under reduced motion.
 * Boundary: no vocabulary prop applies, so every other prop passes through unchanged: the root's `style` there is the
 *           number style (`currency`, `percent`, ...), not a CSS style, and keeps HeroUI Pro's name. The animated root
 *           draws HeroUI Pro's own slots and classes around NumberFlow; a render-prop child, a scientific or
 *           engineering notation and a locale whose digits are not Latin (`ar-SA`'s Arabic-Indic digits, for one),
 *           which NumberFlow cannot draw, get HeroUI Pro's still number. The compound exposes
 *           the documented parts: HeroUI Pro's `NumberValue.Root` is left out. Imports the `number-value` subpath.
 * Runtime: browser
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import { NumberValue as HeroNumberValue } from "@heroui-pro/react/number-value";
import NumberFlow from "@number-flow/react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { Children, isValidElement, type ReactNode } from "react";
import { useLocale } from "react-aria-components";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { NumberValueProps } from "#react/number-value/number-value.props";

const REVEAL = {
  duration: motionTiming(STACKRA_THEME, "reveal").durationMs,
  easing: STACKRA_THEME.motion["reveal"]?.easing ?? "ease-out",
};

/** The root: formats `value` for the locale and rolls it to a new value. */
function NumberValueRoot({ isAnimated = true, children, ...props }: NumberValueProps) {
  const { locale: contextLocale } = useLocale();
  const {
    value,
    locale,
    formatOptions,
    currency,
    maximumFractionDigits,
    minimumFractionDigits,
    notation,
    signDisplay,
    style,
    unit,
    className,
    ...rest
  } = props;
  const format =
    formatOptions ??
    omitUndefined({
      currency,
      maximumFractionDigits,
      minimumFractionDigits,
      notation,
      signDisplay,
      style,
      unit,
    });
  const flowNotation = format.notation;
  const locales = locale ?? contextLocale;
  // NumberFlow reads each digit with parseInt, so digits other than Latin ones (`ar-SA`'s, for one) would vanish.
  const hasLatinDigits =
    new Intl.NumberFormat(locales, format).resolvedOptions().numberingSystem === "latn";
  if (
    !isAnimated ||
    !hasLatinDigits ||
    flowNotation === "scientific" ||
    flowNotation === "engineering" ||
    typeof children === "function"
  ) {
    return <HeroNumberValue.Root {...props}>{children}</HeroNumberValue.Root>;
  }

  let prefix: ReactNode = null;
  let suffix: ReactNode = null;
  const others: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === HeroNumberValue.Prefix) prefix = child;
    else if (isValidElement(child) && child.type === HeroNumberValue.Suffix) suffix = child;
    else others.push(child);
  });

  // HeroUI Pro's render prop gives the parts its slot classes; the markup is HeroUI Pro's, with NumberFlow as the value.
  return (
    <HeroNumberValue.Root value={value}>
      {() => (
        <span
          {...rest}
          className={className ? `number-value ${className}` : "number-value"}
          data-slot="number-value"
        >
          {prefix}
          <NumberFlow
            className="number-value__value"
            data-slot="number-value-value"
            value={value}
            locales={locales}
            format={{ ...format, notation: flowNotation }}
            transformTiming={REVEAL}
            spinTiming={REVEAL}
          />
          {suffix}
          {others}
        </span>
      )}
    </HeroNumberValue.Root>
  );
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
