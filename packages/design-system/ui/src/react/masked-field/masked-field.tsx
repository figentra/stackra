/**
 * Stackra file contract:
 * Purpose: the web `MaskedField` on HeroUI v3's TextField: a labelled field that writes what is typed or pasted into
 *          `mask` (a phone number, an IBAN, a card number, a date) while it holds and reports the raw characters. The
 *          caret stays after the character it followed when the user types, deletes or pastes in the middle, and
 *          Backspace over a separator deletes the character before it. Digits show in the customer's digits and are
 *          read in Latin or Arabic-Indic; a pattern of digits only opens the numeric keyboard.
 * Boundary: the pattern runs left to right in every language, so the input is `dir="ltr"` and aligned to the page's
 *           start edge. A form receives the raw value under `name` from a hidden input. The label, description and
 *           error are tied to the input by React Aria.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); ADR 0165 (HeroUI v3 on web); ADR 0192
 *          (digits setting); ADR 0060 (right-to-left); STA-1371 (wave C, owner request 2026-10-29).
 */
import { Description, FieldError, Input, Label, TextField as HeroTextField } from "@heroui/react";
import { useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { maskEditOf } from "#core/functions/mask-edit-of.function";
import { maskValueOf } from "#core/functions/mask-value-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useNumberFormat } from "#react/hooks/use-number-format";
import type { MaskedFieldProps } from "#react/masked-field/masked-field.props";

/** A labelled field that writes its value into a pattern. */
export function MaskedField({
  mask,
  label,
  description,
  errorMessage,
  placeholder,
  value,
  defaultValue,
  onChange,
  name,
  variant = "primary",
  isFullWidth = true,
  ...rest
}: MaskedFieldProps): ReactElement {
  const format = useNumberFormat();
  const { direction } = useLocale();
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const [own, setOwn] = useState(() => maskValueOf(mask, defaultValue ?? "").raw);
  const raw = value ?? own;
  const shown = maskValueOf(mask, raw).text.replaceAll(/\d/gu, (digit) => format(Number(digit)));

  // Put the caret back where the edit left it, after React writes the new text.
  useLayoutEffect(() => {
    if (caret.current === null || document.activeElement !== input.current) return;
    input.current?.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  return (
    <HeroTextField
      {...omitUndefined(rest)}
      variant={variant}
      fullWidth={isFullWidth}
      value={shown}
      onChange={(text) => {
        const edit = maskEditOf(mask, raw, text, input.current?.selectionStart ?? text.length);
        caret.current = edit.caret;
        if (value === undefined) setOwn(edit.raw);
        if (edit.raw !== raw) onChange?.(edit.raw);
      }}
    >
      {label == null ? null : <Label>{label}</Label>}
      <Input
        ref={input}
        dir="ltr"
        inputMode={/^[^aA*]*$/u.test(mask) ? "numeric" : "text"}
        style={{ textAlign: direction === "rtl" ? "right" : "left" }}
        {...omitUndefined({ placeholder })}
      />
      {description == null ? null : <Description>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      {name ? <input type="hidden" name={name} value={raw} /> : null}
    </HeroTextField>
  );
}
