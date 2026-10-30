/**
 * Stackra file contract:
 * Purpose: `maskValueOf(mask, input)`, what a MaskedField shows and holds for typed or pasted text: `9` takes a digit,
 *          `a` a letter, `A` a letter written upper case, `*` a letter or digit, and any other mask character is
 *          written as is. Arabic-Indic digits are read as digits. Returns the masked text and the raw characters.
 * Boundary: pure; characters the next slot refuses are skipped, a typed literal is consumed, and the text stops after
 *           the last raw character, so it never ends in a dangling separator.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits setting); STA-1371 (wave C, owner request 2026-10-29).
 */
import { latinDigitsOf } from "#core/functions/latin-digits-of.function";

/** What each mask slot takes. */
const SLOTS: Readonly<Record<string, RegExp>> = {
  "9": /\d/u,
  a: /\p{L}/u,
  A: /\p{L}/u,
  "*": /[\p{L}\d]/u,
};

/** The masked text and the raw characters of `input` under `mask`. */
export function maskValueOf(
  mask: string,
  input: string,
): { readonly text: string; readonly raw: string } {
  const chars = [...latinDigitsOf(input)];
  let text = "";
  let raw = "";
  let end = 0;
  let at = 0;
  for (const slot of mask) {
    const accepts = SLOTS[slot];
    if (!accepts) {
      if (at >= chars.length) break;
      text += slot;
      if (chars[at] === slot) at += 1;
      continue;
    }
    while (at < chars.length && !accepts.test(chars[at] ?? "")) at += 1;
    const char = chars[at];
    if (char === undefined) break;
    const kept = slot === "A" ? char.toLocaleUpperCase() : char;
    text += kept;
    raw += kept;
    end = text.length;
    at += 1;
  }
  return { text: text.slice(0, end), raw };
}
