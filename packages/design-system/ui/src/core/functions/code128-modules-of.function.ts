/**
 * Stackra file contract:
 * Purpose: `code128ModulesOf(value)`, a text as Code 128 modules: one character per module, "1" a bar and "0" a
 *          space, start to stop (11 per symbol, 13 for the stop), without the quiet zone. `null` when the text cannot
 *          be encoded (see `code128CodesOf`).
 * Boundary: pure; `barcodePathOf` draws the modules.
 * Runtime: isomorphic
 * Governing contract: ISO/IEC 15417 (Code 128); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { CODE128_PATTERNS } from "#core/constants/code128-patterns.constant";
import { code128CodesOf } from "#core/functions/code128-codes-of.function";

/** The bar and space modules of a Code 128 symbol. */
export function code128ModulesOf(value: string): string | null {
  const codes = code128CodesOf(value);
  if (codes === null) return null;
  let modules = "";
  for (const code of codes) {
    const widths = CODE128_PATTERNS[code] ?? "";
    for (let index = 0; index < widths.length; index += 1)
      modules += (index % 2 === 0 ? "1" : "0").repeat(Number(widths[index]));
  }
  return modules;
}
