/**
 * Stackra file contract:
 * Purpose: the native `NumberField`, the adapted form of ADR 0318 decision 9: HeroUI Native's TextField with an
 *          InputGroup whose input shows the number as `Intl` writes it for the provider's locale and `formatOptions`,
 *          between a decrement and an increment IconButton. Typing keeps a draft that `@internationalized/number` lets
 *          through only while it can still become a number; leaving the field parses it, clamps it to the bounds,
 *          rounds it to what the format shows and reports it (`null` for an empty field). The steppers move the value
 *          by `step` within the bounds, from the nearer bound (or 0) when the field is empty. The keyboard is the
 *          phone's number pad, with the decimal key when the format shows fractions and the punctuation keys when a
 *          value may be negative.
 * Boundary: no styling of its own beyond `self-start` when not full width; the look is HeroUI Native's. It parses
 *           with the same `NumberParser` React Aria's web field uses, so a value reads the same on both runtimes,
 *           Arabic digits, percent and currency included. A percent field steps by 0.01 unless `step` is given, as on
 *           web. `className` styles the root; `name` does not reach the input. "Increase" and "Decrease" are English
 *           defaults until i18n ships. Needs the native `DesignSystemProvider`, which holds the locale.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decision 9); ADR 0055 (forms: one
 *          field contract); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 1.3.1, 4.1.2.
 */
import { NumberFormatter, NumberParser } from "@internationalized/number";
import {
  Description,
  FieldError,
  InputGroup as HeroInputGroup,
  Label,
  TextField as HeroTextField,
} from "heroui-native";
import { useMemo, useState, type ComponentPropsWithRef } from "react";
import { Platform, type KeyboardTypeOptions } from "react-native";

import type { NumberFieldContractProps } from "#contracts/types/number-field-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { IconButton } from "#native/icon-button/icon-button";

/**
 * Props of the native NumberField: the shared contract plus HeroUI Native's input props, passed through to the input.
 * The contract's names replace HeroUI's and React Native's: `onChange` for `onChangeText`, `isReadOnly` for `readOnly`
 * and `editable`, `isDisabled` and `isInvalid` for the input's own.
 */
export type NumberFieldProps = NumberFieldContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroInputGroup.Input>,
    keyof NumberFieldContractProps | "children" | "onChangeText" | "readOnly" | "editable"
  >;

// shortcut: English words until @stackra/i18n ships; then the keys `ui::number-field.*`.
const WORDS = { increment: "Increase", decrement: "Decrease" } as const;

/** The keyboard that can type every value the field accepts. */
function keyboardOf(minValue: number | undefined, hasFractions: boolean): KeyboardTypeOptions {
  // Only these keyboards carry a minus sign; `numeric` is the decimal pad on iOS.
  if (minValue === undefined || minValue < 0)
    return Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric";
  return hasFractions ? "decimal-pad" : "number-pad";
}

/**
 * A labelled number field with increment and decrement buttons. A field without a string `label` needs an
 * `accessibilityLabel`. Pair `value` with `onChange` to control it, or give `defaultValue` and let it keep its own
 * number; `onChange` receives the new number, or `null` once the field is emptied.
 */
export function NumberField({
  label,
  description,
  errorMessage,
  placeholder,
  variant = "primary",
  isFullWidth = true,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  step,
  formatOptions,
  hasSteppers = true,
  incrementLabel = WORDS.increment,
  decrementLabel = WORDS.decrement,
  // `name` is the form adapter's key; a native text input has no form to submit under it.
  name: _name,
  className,
  accessibilityLabel,
  onBlur,
  ...rest
}: NumberFieldProps) {
  const { locale } = useDesignSystem();
  // `@internationalized/number` types its options without `undefined` members.
  const [formatter, parser] = useMemo(() => {
    const options = formatOptions && omitUndefined(formatOptions);
    return [new NumberFormatter(locale, options), new NumberParser(locale, options)] as const;
  }, [locale, formatOptions]);
  const [own, setOwn] = useState<number | null>(defaultValue ?? null);
  // The text while the user types; `null` shows the value as the format writes it.
  const [draft, setDraft] = useState<string | null>(null);
  const current = value === undefined ? own : value;
  const increment = step ?? (formatOptions?.style === "percent" ? 0.01 : 1);
  const isLocked = Boolean(isDisabled || isReadOnly);

  const clamp = (next: number) =>
    Math.min(maxValue ?? Infinity, Math.max(minValue ?? -Infinity, next));
  // Through the format and back, so the value held is the value shown and 0.1 + 0.2 stays 0.3.
  const settle = (next: number) => parser.parse(formatter.format(clamp(next)));

  const commit = (next: number | null) => {
    setDraft(null);
    if (next === current) return;
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };

  const commitDraft = () => {
    if (draft === null) return;
    if (draft.trim() === "") return commit(null);
    const parsed = parser.parse(draft);
    if (Number.isNaN(parsed)) return setDraft(null);
    commit(settle(parsed));
  };

  const stepBy = (direction: 1 | -1) => {
    if (current === null) return commit(settle((direction > 0 ? minValue : maxValue) ?? 0));
    commit(settle(current + direction * increment));
  };

  const hasFractions =
    (formatter.resolvedOptions().maximumFractionDigits ?? 0) > 0 || !Number.isInteger(increment);

  return (
    <HeroTextField
      {...omitUndefined({ isRequired, isInvalid, isDisabled })}
      className={[isFullWidth ? "" : "self-start", className].filter(Boolean).join(" ")}
    >
      {label == null ? null : <Label>{label}</Label>}
      <HeroInputGroup isDisabled={isDisabled ?? false}>
        {hasSteppers ? (
          <HeroInputGroup.Prefix>
            <IconButton
              icon="minus"
              label={decrementLabel}
              variant="ghost"
              size="sm"
              isDisabled={
                isLocked || (current !== null && minValue !== undefined && current <= minValue)
              }
              onPress={() => stepBy(-1)}
            />
          </HeroInputGroup.Prefix>
        ) : null}
        <HeroInputGroup.Input
          keyboardType={keyboardOf(minValue, hasFractions)}
          accessibilityLabel={accessibilityLabel ?? (typeof label === "string" ? label : undefined)}
          placeholder={placeholder}
          variant={variant}
          value={draft ?? (current === null ? "" : formatter.format(current))}
          onChangeText={(text) => {
            if (text === "" || parser.isValidPartialNumber(text, minValue, maxValue))
              setDraft(text);
          }}
          onBlur={(event) => {
            commitDraft();
            onBlur?.(event);
          }}
          readOnly={isReadOnly}
          {...rest}
        />
        {hasSteppers ? (
          <HeroInputGroup.Suffix>
            <IconButton
              icon="plus"
              label={incrementLabel}
              variant="ghost"
              size="sm"
              isDisabled={
                isLocked || (current !== null && maxValue !== undefined && current >= maxValue)
              }
              onPress={() => stepBy(1)}
            />
          </HeroInputGroup.Suffix>
        ) : null}
      </HeroInputGroup>
      {description == null ? null : <Description hideOnInvalid>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTextField>
  );
}
