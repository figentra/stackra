/**
 * Stackra file contract:
 * Purpose: `RTL_RUN`, a right-to-left run: from one strong right-to-left letter (Arabic, Hebrew, Syriac, Thaana,
 *          N'Ko) to the last, spanning the spaces, digits, marks and punctuation between them.
 * Boundary: a global pattern, used only with `replaceAll`, which never reads its `lastIndex`.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-026; Unicode UAX 9.
 */

/** Strong right-to-left scripts. */
const RTL =
  "\\p{Script=Arabic}\\p{Script=Hebrew}\\p{Script=Syriac}\\p{Script=Thaana}\\p{Script=Nko}";

/** One right-to-left run. */
export const RTL_RUN = new RegExp(
  `[${RTL}](?:[${RTL}\\p{M}\\p{N}\\p{P}\\s]*[${RTL}\\p{M}])?`,
  "gu",
);
