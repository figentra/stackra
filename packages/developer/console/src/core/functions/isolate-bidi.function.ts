/**
 * Stackra file contract:
 * Purpose: `isolateBidi(text)`, `text` with each right-to-left run (Arabic, Hebrew, Syriac, Thaana, N'Ko) wrapped in
 *          FIRST STRONG ISOLATE U+2068 and POP DIRECTIONAL ISOLATE U+2069, so a terminal that applies the bidi
 *          algorithm keeps the run whole inside a left-to-right layout. Characters are never reordered here.
 * Boundary: pure; idempotent (text that already holds an isolate is returned as it is).
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-026; Unicode UAX 9 (explicit isolates).
 */

/** A strong right-to-left letter. */
const RTL =
  "\\p{Script=Arabic}\\p{Script=Hebrew}\\p{Script=Syriac}\\p{Script=Thaana}\\p{Script=Nko}";

/** A run: from one RTL letter to the last, spanning spaces, digits, marks and punctuation between them. */
const RUN = new RegExp(`[${RTL}](?:[${RTL}\\p{M}\\p{N}\\p{P}\\s]*[${RTL}\\p{M}])?`, "gu");

/** `text` with its RTL runs isolated. */
export function isolateBidi(text: string): string {
  if (text.includes("⁨")) return text;
  return text.replaceAll(RUN, (run) => `⁨${run}⁩`);
}
