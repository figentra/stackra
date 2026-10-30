/**
 * Stackra file contract:
 * Purpose: the web `MoneyField`: the web NumberField over an amount held in minor units. It scales the amount by the
 *          currency's digits to show and read it in the currency's format, the provider's locale and its digits
 *          (Arabic-Indic in Arabic), steps by one major unit unless told otherwise, keeps the largest amount when the
 *          user goes past it and shakes, rolls the digits in when the app sets the amount, and draws a currency picker
 *          beside the amount when `currencies` holds two or more codes.
 * Boundary: no styling of its own beyond the row that holds the picker; the look is the NumberField's and the Select's.
 *           A `step` also snaps a typed amount to its multiples, as React Aria does. Every motion is skipped under
 *           prefers-reduced-motion. "Currency" comes from the `ui` catalogue.
 * Runtime: browser
 * Governing contract: gap inventory row 2 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3); ADR 0303
 *          (decision 7); ADR 0055 (forms: one field contract); WCAG 2.2 SC 2.3.3.
 */
import type { ReactElement } from "react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { currencyFractionDigitsOf } from "#core/functions/currency-fraction-digits-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { MoneyFieldProps } from "#react/money-field/money-field.props";
import { NumberField } from "#react/number-field/number-field";
import { Select } from "#react/select/select";

const BASE = motionTiming(STACKRA_THEME, "base");

/**
 * A labelled amount field. The value is an integer in minor units (halalas, cents, fils), or `null` for an empty field;
 * `onChange` receives the new amount in the same units.
 */
export function MoneyField({
  currency,
  currencies,
  onCurrencyChange,
  currencyLabel,
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  step,
  isDisabled,
  isReadOnly,
  ...rest
}: MoneyFieldProps): ReactElement {
  const t = useUiText();
  const digits = currencyFractionDigitsOf(currency);
  const scale = 10 ** digits;
  const [own, setOwn] = useState<number | null>(defaultValue ?? null);
  const current = value === undefined ? own : value;
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const isReduced = useReducedMotion() ?? false;
  // The last amount the field itself reported; any other change came from the app.
  const reported = useRef(current);

  useEffect(() => {
    if (current !== reported.current && current !== null && !isReduced)
      void animate(
        "input",
        { y: [-6, 0], opacity: [0.4, 1] },
        { duration: BASE.durationMs / 1000 },
      );
    reported.current = current;
  }, [current, isReduced, animate]);

  const report = (next: number | null) => {
    reported.current = next;
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };

  const fromMajor = (major: number | null) => {
    if (major === null) return report(null);
    const minor = Math.round(major * scale);
    if (maxValue === undefined || minor <= maxValue) return report(minor);
    if (!isReduced && scope.current)
      void animate(
        scope.current,
        { x: [0, -8, 8, -5, 5, 0] },
        { duration: (BASE.durationMs * 2) / 1000 },
      );
    report(maxValue);
  };

  const hasPicker = (currencies?.length ?? 0) > 1;
  const field = (
    <NumberField
      {...rest}
      {...(isDisabled === undefined ? {} : { isDisabled })}
      {...(isReadOnly === undefined ? {} : { isReadOnly })}
      value={current === null ? null : current / scale}
      onChange={fromMajor}
      // The largest is checked here, so going past it can be told apart from landing on it.
      {...(minValue === undefined ? {} : { minValue: minValue / scale })}
      // Without a step React Aria steps by 1 (one major unit) and never snaps a typed amount; a given step snaps it.
      {...(step === undefined ? {} : { step: step / scale })}
      formatOptions={{
        style: "currency",
        currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }}
    />
  );

  return (
    <div ref={scope} data-slot="money-field" className={hasPicker ? "flex items-end gap-2" : ""}>
      {hasPicker ? <div className="min-w-0 flex-1">{field}</div> : field}
      {hasPicker ? (
        <Select
          aria-label={currencyLabel ?? t(UI_KEYS.ui.money_field.currency)}
          items={(currencies ?? []).map((code) => ({ id: code, label: code }))}
          value={currency}
          onChange={(code) => {
            if (code !== null && code !== currency) onCurrencyChange?.(code);
          }}
          isDisabled={Boolean(isDisabled || isReadOnly)}
          isFullWidth={false}
        />
      ) : null}
    </div>
  );
}
