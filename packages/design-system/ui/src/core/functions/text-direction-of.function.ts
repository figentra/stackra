/**
 * Stackra file contract:
 * Purpose: `textDirectionOf(text)`: the direction of a text by its first strong letter (the rule `dir="auto"` uses),
 *          for a wrapper such as a list whose own `dir="auto"` cannot see text inside children that set `dir`.
 * Boundary: pure; a text with no letter has no direction.
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (right-to-left); ADR 0466 (decision 8); STA-1371.
 */

/** Letters of the scripts written right to left. */
const RTL_LETTER =
  /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/u;

/**
 * The direction of `text`.
 * @param text - any text
 * @returns `rtl` or `ltr` by the first letter, or undefined when there is none
 */
export function textDirectionOf(text: string): "ltr" | "rtl" | undefined {
  const letter = /\p{L}/u.exec(text)?.[0];
  if (letter === undefined) return undefined;
  return RTL_LETTER.test(letter) ? "rtl" : "ltr";
}
