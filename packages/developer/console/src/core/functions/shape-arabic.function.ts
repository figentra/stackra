/**
 * Stackra file contract:
 * Purpose: `shapeArabic(text)`, Arabic letters replaced by their joined presentation forms (isolated, final, initial or
 *          medial, by their neighbours), with lam-alef written as its ligature, for terminals that do not shape.
 * Boundary: pure; logical order kept (reordering is `visualBidi`'s job). Harakat are transparent to joining and stay
 *           after their letter. Letters outside the basic block pass through unchanged.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-026; Unicode ArabicShaping.txt.
 */
import { ARABIC_FORMS } from "#core/constants/arabic-forms.constant";

/** Lam. */
const LAM = 0x06_44;

/** Hamza, which never joins. */
const HAMZA = 0x06_21;

/** Tatweel, which joins on both sides and has no forms of its own. */
const TATWEEL = 0x06_40;

/** The isolated lam-alef ligature by the alef it takes (the final form is the next code point). */
const LAM_ALEF: ReadonlyMap<number, number> = new Map([
  [0x06_22, 0xfe_f5],
  [0x06_23, 0xfe_f7],
  [0x06_25, 0xfe_f9],
  [0x06_27, 0xfe_fb],
]);

/** A mark that joining looks through (harakat, superscript alef). */
const isMark = (code: number) => (code >= 0x06_4b && code <= 0x06_5f) || code === 0x06_70;

/** Whether `code` connects to the letter after it in logical order. */
const joinsNext = (code: number | undefined) =>
  code !== undefined && (code === TATWEEL || ARABIC_FORMS.get(code)?.[1] === true);

/** Whether `code` accepts a connection from the letter before it. */
const joinsPrevious = (code: number | undefined) =>
  code !== undefined && code !== HAMZA && (code === TATWEEL || ARABIC_FORMS.has(code));

/** `text` with its Arabic letters in their joined forms. */
export function shapeArabic(text: string): string {
  const codes = [...text].map((character) => character.codePointAt(0) ?? 0);
  // The nearest letter before (-1) or after (1) `index`, looking through marks.
  const letterAt = (index: number, step: 1 | -1): number | undefined => {
    for (let at = index + step; at >= 0 && at < codes.length; at += step) {
      const code = codes[at] ?? 0;
      if (!isMark(code)) return code;
    }
    return undefined;
  };
  let shaped = "";
  for (let index = 0; index < codes.length; index += 1) {
    const code = codes[index] ?? 0;
    const forms = ARABIC_FORMS.get(code);
    if (forms === undefined || code === HAMZA) {
      shaped += String.fromCodePoint(code === HAMZA ? 0xfe_80 : code);
      continue;
    }
    const joined = joinsNext(letterAt(index, -1));
    const next = letterAt(index, 1);
    const ligature = code === LAM && next !== undefined ? LAM_ALEF.get(next) : undefined;
    if (ligature !== undefined) {
      shaped += String.fromCodePoint(ligature + (joined ? 1 : 0));
      // Keep the lam's marks, then skip the alef the ligature already holds.
      while (isMark(codes[index + 1] ?? 0)) {
        index += 1;
        shaped += String.fromCodePoint(codes[index] ?? 0);
      }
      index += 1;
      continue;
    }
    const [isolated, dual] = forms;
    const linked = dual && joinsPrevious(next);
    const offset = !dual ? (joined ? 1 : 0) : joined && linked ? 3 : linked ? 2 : joined ? 1 : 0;
    shaped += String.fromCodePoint(isolated + offset);
  }
  return shaped;
}
