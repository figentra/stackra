/**
 * Stackra file contract:
 * Purpose: the native `NumberField`, the adapted form of ADR 0318 decision 9: HeroUI Native's TextField with an
 *          InputGroup whose input shows the number as `Intl` writes it for the provider's locale and `formatOptions`,
 *          between a decrement and an increment IconButton. Typing keeps a draft that `@internationalized/number` lets
 *          through only while it can still become a number, and a typed number inside the bounds is reported at once
 *          (a press that does not blur the input reads it); leaving the field clamps the draft to the bounds, rounds it
 *          to what the format shows and reports it (`null` for an empty field). The steppers move the typed or held
 *          value by `step` within the bounds, from the nearer bound (or 0) when the field is empty. The keyboard is the
 *          phone's number pad, with the decimal key when the format shows fractions and the punctuation keys when a
 *          value may be negative.
 * Boundary: no styling of its own beyond `self-start` when not full width; the look is HeroUI Native's. It parses
 *           with the same `NumberParser` React Aria's web field uses, so a value reads the same on both runtimes,
 *           Arabic digits, percent and currency included. A percent field steps by 0.01 unless `step` is given, as on
 *           web. Inside a sheet the input moves the sheet clear of the keyboard (HeroUI Native's sheet-aware handlers).
 *           `className` styles the root; `name` does not reach the input. "Increase" and "Decrease" come from the `ui`
 *           catalogue in the active locale. Needs the native `DesignSystemProvider`, which holds the locale.
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
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { useMemo, useState, type ReactElement } from "react";
import { Platform, type KeyboardTypeOptions } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { IconButton } from "#native/icon-button/icon-button";
import type { NumberFieldProps } from "#native/number-field/number-field.props";

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
  incrementLabel: incrementLabelProp,
  decrementLabel: decrementLabelProp,
  // `name` is the form adapter's key; a native text input has no form to submit under it.
  name: _name,
  className,
  accessibilityLabel,
  onFocus,
  onBlur,
  ...rest
}: NumberFieldProps): ReactElement {
  const t = useUiText();
  const incrementLabel = incrementLabelProp ?? t(UI_KEYS.ui.number_field.increment);
  const decrementLabel = decrementLabelProp ?? t(UI_KEYS.ui.number_field.decrement);
  const { locale } = useDesignSystem();
  // Inside a sheet the keyboard must move the sheet; outside one these handlers do nothing.
  const sheet = useBottomSheetAwareHandlers();
  // Keyed by the options' content, so an inline `formatOptions` object reuses the formatter and the parser.
  const optionsKey = JSON.stringify(formatOptions ?? {});
  const [formatter, parser] = useMemo(() => {
    // `@internationalized/number` types its options without `undefined` members.
    const options = omitUndefined(JSON.parse(optionsKey) as Intl.NumberFormatOptions);
    return [new NumberFormatter(locale, options), new NumberParser(locale, options)] as const;
  }, [locale, optionsKey]);
  const [own, setOwn] = useState<number | null>(defaultValue ?? null);
  // The text while the user types; `null` shows the value as the format writes it.
  const [draft, setDraft] = useState<string | null>(null);
  const current = value === undefined ? own : value;
  const increment = step ?? (formatOptions?.style === "percent" ? 0.01 : 1);
  const isLocked = Boolean(isDisabled || isReadOnly);

  const clamp = (next: number) =>
    Math.min(maxValue ?? Infinity, Math.max(minValue ?? -Infinity, next));
  const isInBounds = (next: number) => clamp(next) === next;
  // Through the format and back, so the value held is the value shown and 0.1 + 0.2 stays 0.3.
  const settle = (next: number) => parser.parse(formatter.format(clamp(next)));
  // The number the draft reads as, `null` for an empty draft, `NaN` while it cannot be one yet.
  const readDraft = (text: string) => (text.trim() === "" ? null : parser.parse(text));
  // What the steppers start from: the typed number when there is one, so a press never drops it.
  const typed = draft === null ? current : readDraft(draft);
  const base = typed === null || !Number.isNaN(typed) ? typed : current;

  const report = (next: number | null) => {
    if (next === current) return;
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };

  const commitDraft = () => {
    if (draft === null) return;
    setDraft(null);
    const parsed = readDraft(draft);
    if (parsed === null) return report(null);
    if (!Number.isNaN(parsed)) report(settle(parsed));
  };

  const stepBy = (direction: 1 | -1) => {
    setDraft(null);
    if (base === null) return report(settle((direction > 0 ? minValue : maxValue) ?? 0));
    report(settle(base + direction * increment));
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
              isDisabled={isLocked || (base !== null && minValue !== undefined && base <= minValue)}
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
            if (text !== "" && !parser.isValidPartialNumber(text, minValue, maxValue)) return;
            setDraft(text);
            // A number inside the bounds is reported as it is typed, so a press that does not blur the input (a
            // Save, a sheet's Done) reads it; one outside them waits for the clamp on leaving the field.
            const parsed = readDraft(text);
            if (parsed === null) report(null);
            else if (!Number.isNaN(parsed) && isInBounds(parsed)) report(settle(parsed));
          }}
          onFocus={(event) => {
            sheet.onFocus(event);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            commitDraft();
            sheet.onBlur(event);
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
              isDisabled={isLocked || (base !== null && maxValue !== undefined && base >= maxValue)}
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
