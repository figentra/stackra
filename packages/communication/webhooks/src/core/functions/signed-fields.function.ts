/**
 * Stackra file contract:
 * Purpose: `signedFields`, the text an ordered-field scheme signs: the values of `fields` in the payload, in order,
 *          joined with nothing between them; a missing or null value is empty, a boolean `true`/`false`, and a path
 *          named in `decimals` is written with that many decimals (`100` → `100.00`).
 * Boundary: internal; the ordered-field HMAC (Paymob) and keyed field digest (Fawry) schemes share it. Answers
 *           `undefined` when a field is an object or an array, which no published recipe signs.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); STA-1357.
 */
import { valueAt } from "#core/functions/value-at.function";

/**
 * The joined values.
 *
 * @example
 * signedFields({ obj: { amount: 100, ok: true } }, ["obj.amount", "obj.ok"], { "obj.amount": 2 }); // "100.00true"
 */
export function signedFields(
  payload: unknown,
  fields: readonly string[],
  decimals: Readonly<Record<string, number>> = {},
): string | undefined {
  let text = "";
  for (const field of fields) {
    const value = valueAt(payload, field);
    const places = decimals[field];
    if (value === undefined || value === null) continue;
    if (typeof value === "object") return undefined;
    if (places !== undefined && (typeof value === "number" || typeof value === "string")) {
      const number = Number(value);
      if (!Number.isFinite(number)) return undefined;
      text += number.toFixed(places);
    } else text += String(value);
  }
  return text;
}
