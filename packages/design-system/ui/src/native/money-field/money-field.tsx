/**
 * Stackra file contract:
 * Purpose: the native `MoneyField`: the native NumberField over an amount held in minor units, shown and read in the
 *          currency's format and the provider's locale and digits (Arabic-Indic in Arabic). It steps by one major unit
 *          unless told otherwise (each stepper press ticks a light haptic through the IconButton), keeps the largest
 *          amount when the user goes past it with a shake and an error haptic, rolls the digits in when the app sets the
 *          amount, and draws a currency picker beside it when `currencies` holds two or more codes.
 * Boundary: no styling beyond the row that holds the picker. Motion follows the system's reduced-motion setting; the
 *           haptics follow the app-wide switch. "Currency" comes from the `ui` catalogue.
 * Runtime: react-native
 * Governing contract: gap inventory row 2 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3); ADR 0055
 *          (forms: one field contract); ADR 0165 (HeroUI Native on native).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { currencyFractionDigitsOf } from "#core/functions/currency-fraction-digits-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { haptics } from "#native/haptics/haptics";
import type { MoneyFieldProps } from "#native/money-field/money-field.props";
import { NumberField } from "#native/number-field/number-field";
import { Select } from "#native/select/select";
import { useShake } from "#native/shake/use-shake";

const BASE = motionTiming(STACKRA_THEME, "base");

/**
 * A labelled amount field. The value is an integer in minor units, or `null` for an empty field; `onChange` receives
 * the new amount in the same units.
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
  const { style: shakeStyle, shake } = useShake();
  const isReduced = useReducedMotion();
  const roll = useSharedValue(0);
  const rollStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.abs(roll.value) / 12,
    transform: [{ translateY: roll.value }],
  }));
  // The last amount the field itself reported; any other change came from the app.
  const reported = useRef(current);

  useEffect(() => {
    if (current !== reported.current && current !== null && !isReduced) {
      roll.set(
        withSequence(withTiming(-6, { duration: 0 }), withTiming(0, { duration: BASE.durationMs })),
      );
    }
    reported.current = current;
  }, [current, isReduced, roll]);

  const report = (next: number | null) => {
    reported.current = next;
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };

  const fromMajor = (major: number | null) => {
    if (major === null) return report(null);
    const minor = Math.round(major * scale);
    if (maxValue === undefined || minor <= maxValue) return report(minor);
    shake();
    haptics.play("error");
    report(maxValue);
  };

  const hasPicker = (currencies?.length ?? 0) > 1;
  return (
    <Animated.View style={shakeStyle} className={hasPicker ? "flex-row items-end gap-2" : ""}>
      <Animated.View style={rollStyle} className={hasPicker ? "min-w-0 flex-1" : ""}>
        <NumberField
          {...rest}
          {...(isDisabled === undefined ? {} : { isDisabled })}
          {...(isReadOnly === undefined ? {} : { isReadOnly })}
          value={current === null ? null : current / scale}
          onChange={fromMajor}
          // The largest is checked here, so going past it can be told apart from landing on it.
          {...(minValue === undefined ? {} : { minValue: minValue / scale })}
          step={(step ?? scale) / scale}
          formatOptions={{
            style: "currency",
            currency,
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
          }}
        />
      </Animated.View>
      {hasPicker ? (
        <View>
          <Select
            // A visible label: it names the trigger and lines the picker up with the amount's label.
            label={currencyLabel ?? t(UI_KEYS.ui.money_field.currency)}
            items={(currencies ?? []).map((code) => ({ id: code, label: code }))}
            value={currency}
            onChange={(code) => {
              if (code !== null && code !== currency) onCurrencyChange?.(code);
            }}
            isDisabled={Boolean(isDisabled || isReadOnly)}
            presentation="bottom-sheet"
          />
        </View>
      ) : null}
    </Animated.View>
  );
}
