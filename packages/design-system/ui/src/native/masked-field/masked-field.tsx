/**
 * Stackra file contract:
 * Purpose: the native `MaskedField` on the house TextField: a labelled field that writes what is typed or pasted into
 *          `mask` (a phone number, an IBAN, a card number, a date) while it holds and reports the raw characters. The
 *          caret stays after the character it followed when the user types, deletes or pastes in the middle, and
 *          Backspace over a separator deletes the character before it. Digits show in the customer's digits and are
 *          read in Latin or Arabic-Indic; a pattern of digits only opens the number pad, one with `A` slots types
 *          capitals.
 * Boundary: the caret is controlled through `selection`, moved by the length change of each edit. The pattern runs
 *           left to right in every language (`writingDirection: "ltr"`), aligned to the layout's start edge.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); ADR 0192 (digits setting); ADR 0060
 *          (right-to-left); STA-1371 (wave C, owner request 2026-10-29).
 */
import { useState, type ReactElement } from "react";

import { maskEditOf } from "#core/functions/mask-edit-of.function";
import { maskValueOf } from "#core/functions/mask-value-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import type { MaskedFieldProps } from "#native/masked-field/masked-field.props";
import { TextField } from "#native/text-field/text-field";
import { useNumberFormat } from "#native/hooks/use-number-format";

/** A labelled field that writes its value into a pattern. */
export function MaskedField({
  mask,
  value,
  defaultValue,
  onChange,
  ...rest
}: MaskedFieldProps): ReactElement {
  const format = useNumberFormat();
  const { direction } = useDesignSystem();
  const [own, setOwn] = useState(() => maskValueOf(mask, defaultValue ?? "").raw);
  const raw = value ?? own;
  const shown = maskValueOf(mask, raw).text.replaceAll(/\d/gu, (digit) => format(Number(digit)));
  const [selection, setSelection] = useState({ start: shown.length, end: shown.length });

  return (
    <TextField
      {...omitUndefined(rest)}
      value={shown}
      keyboardType={/^[^aA*]*$/u.test(mask) ? "number-pad" : "default"}
      autoCapitalize={mask.includes("A") ? "characters" : "none"}
      autoCorrect={false}
      selection={selection}
      onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
      style={{ writingDirection: "ltr", textAlign: direction === "rtl" ? "right" : "left" }}
      onChange={(text) => {
        // The caret moved by the edit's length change from where the selection ended.
        const at = Math.max(0, selection.end + text.length - shown.length);
        const edit = maskEditOf(mask, raw, text, at);
        setSelection({ start: edit.caret, end: edit.caret });
        if (value === undefined) setOwn(edit.raw);
        if (edit.raw !== raw) onChange?.(edit.raw);
      }}
    />
  );
}
