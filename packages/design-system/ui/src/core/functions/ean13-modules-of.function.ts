/**
 * Stackra file contract:
 * Purpose: `ean13ModulesOf(value)`, an EAN-13 number as its 95 modules ("1" a bar, "0" a space) and its full
 *          thirteen digits: twelve digits get their check digit added; thirteen must carry the right one. `null`
 *          for anything else, including a wrong check digit.
 * Boundary: pure; `barcodePathOf` draws the modules. No quiet zone, no add-on.
 * Runtime: isomorphic
 * Governing contract: ISO/IEC 15420 (EAN/UPC); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { EAN13_L_CODES } from "#core/constants/ean13-l-codes.constant";
import { EAN13_PARITY } from "#core/constants/ean13-parity.constant";
import { ean13CheckDigitOf } from "#core/functions/ean13-check-digit-of.function";

/** R is L inverted. */
const rCodeOf = (digit: number): string =>
  [...(EAN13_L_CODES[digit] ?? "")].map((bit) => (bit === "1" ? "0" : "1")).join("");

/** The modules and the thirteen digits, or null for an invalid number. */
export function ean13ModulesOf(
  value: string,
): { readonly modules: string; readonly digits: string } | null {
  if (!/^\d{12,13}$/.test(value)) return null;
  const check = ean13CheckDigitOf(value.slice(0, 12));
  if (check === null || (value.length === 13 && Number(value[12]) !== check)) return null;
  const digits = value.slice(0, 12) + String(check);
  const parity = EAN13_PARITY[Number(digits[0])] ?? "";
  let modules = "101";
  for (let i = 1; i <= 6; i += 1) {
    const digit = Number(digits[i]);
    // G is R read backwards.
    modules +=
      parity[i - 1] === "G"
        ? [...rCodeOf(digit)].reduce((reversed, bit) => bit + reversed, "")
        : (EAN13_L_CODES[digit] ?? "");
  }
  modules += "01010";
  for (let i = 7; i <= 12; i += 1) modules += rCodeOf(Number(digits[i]));
  return { modules: modules + "101", digits };
}
