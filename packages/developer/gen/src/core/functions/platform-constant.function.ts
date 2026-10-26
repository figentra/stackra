/**
 * Stackra file contract:
 * Purpose: `platformConstant`, gen's evaluation of the closed set of platform constructors a default may use:
 *          `Duration.seconds|minutes|hours|days|parse`, `Money.of|ofMinor|zero` and `Translated.of`, run at build time
 *          with the real implementations so the default is exactly what the runtime would build (`Translated.of` is
 *          checked here as `@stackra/model` checks it, since gen does not depend on that package).
 * Boundary: pure: the constructors read no clock, locale or environment. Any other callee is not a constant
 *           (`undefined`), which the analyser reports as `shape_default_not_constant`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: defaults built by Duration.* and Money.of are constants); ADR 0162
 *                     (decision 2: a `Translated` default is its locale map); OS gen pass 2026-10-26 (STA-1283).
 */
import { Duration } from "@stackra/contracts";
import { Money } from "@stackra/money";

import type { FieldDefault } from "#core/types/field-default.type";

/** The default of a money value, in the codec's wire form, rebuilt from minor units in generated code. */
function moneyDefault(money: Money): FieldDefault {
  return {
    value: { minor: money.minor, currency: money.currency },
    code: `Money.ofMinor(${money.minor}, ${JSON.stringify(money.currency)})`,
    imports: [["Money", "@stackra/money"]],
  };
}

/** The default of a duration: its canonical ISO 8601 text, rebuilt through the validation helper. */
function durationDefault(duration: Duration): FieldDefault {
  return {
    value: duration,
    code: `duration(${JSON.stringify(duration)})`,
    imports: [["duration", "@stackra/validation"]],
  };
}

/** The default of a per-locale text: its locale map, rebuilt through `Translated.of`. */
function translatedDefault(values: unknown): FieldDefault {
  if (typeof values !== "object" || values === null || Array.isArray(values))
    throw new TypeError("Translated.of takes an object of locale tags to strings");
  for (const [locale, text] of Object.entries(values))
    if (locale === "" || typeof text !== "string")
      throw new TypeError(`Translated.of: "${locale}" must be a locale tag with a string value`);
  return {
    value: values,
    code: `Translated.of(${JSON.stringify(values)})`,
    imports: [["Translated", "@stackra/model"]],
  };
}

/**
 * The default `callee(...args)` builds, when the callee is a platform constructor.
 *
 * @param callee - the callee as written (`Duration.minutes`, `Money.of`).
 * @param args - the evaluated constant arguments.
 * @returns the default, or undefined when the callee is not in the closed set or an argument has the wrong type.
 * @throws RangeError when the constructor itself refuses the arguments (`Money.of("1.234", "USD")`); TypeError when
 *         `Translated.of` gets anything but a map of locale tags to strings.
 * @example
 * platformConstant("Duration.minutes", [5]); // { value: "PT5M", code: 'duration("PT5M")', ... }
 * platformConstant("Money.of", ["12.50", "USD"]); // { value: { minor: 1250, currency: "USD" }, ... }
 */
export function platformConstant(
  callee: string,
  args: readonly unknown[],
): FieldDefault | undefined {
  const [first, second] = args;
  switch (callee) {
    case "Duration.seconds":
    case "Duration.minutes":
    case "Duration.hours":
    case "Duration.days": {
      if (typeof first !== "number") return undefined;
      const unit = callee.slice("Duration.".length) as "seconds" | "minutes" | "hours" | "days";
      return durationDefault(Duration[unit](first));
    }
    case "Duration.parse":
      return typeof first === "string" ? durationDefault(Duration.parse(first)) : undefined;
    case "Money.of":
      return typeof first === "string" && typeof second === "string"
        ? moneyDefault(Money.of(first, second))
        : undefined;
    case "Money.ofMinor":
      return typeof first === "number" && typeof second === "string"
        ? moneyDefault(Money.ofMinor(first, second))
        : undefined;
    case "Money.zero":
      return typeof first === "string" ? moneyDefault(Money.zero(first)) : undefined;
    case "Translated.of":
      return translatedDefault(first);
    default:
      return undefined;
  }
}
