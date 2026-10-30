/**
 * Stackra file contract:
 * Purpose: `maskEditOf(mask, previousRaw, input, caret)`, one edit of a MaskedField: the new raw value, the masked
 *          text and where the caret goes, from the input's text and caret right after the user typed, deleted or
 *          pasted. Deleting a separator deletes the raw character before it, so Backspace never sticks. Shared by the
 *          web and native MaskedField.
 * Boundary: pure; the caret is counted in raw characters, so it lands after the same character it followed.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C, owner request 2026-10-29).
 */
import { maskCaretOf } from "#core/functions/mask-caret-of.function";
import { maskValueOf } from "#core/functions/mask-value-of.function";

/** The raw value, masked text and caret after the input became `input` with the caret at `caret`. */
export function maskEditOf(
  mask: string,
  previousRaw: string,
  input: string,
  caret: number,
): { readonly raw: string; readonly text: string; readonly caret: number } {
  const previous = maskValueOf(mask, previousRaw).text;
  let { raw } = maskValueOf(mask, input);
  let before = maskValueOf(mask, input.slice(0, caret)).raw.length;
  // Only a separator went: take the raw character before the caret with it.
  if (raw === previousRaw && input.length < previous.length && before > 0) {
    raw = raw.slice(0, before - 1) + raw.slice(before);
    before -= 1;
  }
  const text = maskValueOf(mask, raw).text;
  return { raw, text, caret: Math.min(maskCaretOf(mask, before), text.length) };
}
