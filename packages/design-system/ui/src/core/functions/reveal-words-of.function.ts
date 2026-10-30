/**
 * Stackra file contract:
 * Purpose: the pieces `TextReveal` fades in one after another: the words of a text split on spaces, or the whole text
 *          as one piece when it mixes right-to-left letters (Arabic, Hebrew) with Latin ones.
 * Boundary: pure. Never splits inside a word, so Arabic letters stay joined. Each piece is laid out as its own box,
 *           which the bidi algorithm orders as a neutral: in one script that follows the paragraph's direction, but a
 *           Latin phrase inside an Arabic line would come out reversed word by word, so a mixed text is not split.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer); ADR 0060 (right-to-left).
 */

/** Hebrew, Arabic, Syriac, Thaana and the Arabic presentation forms. */
const RTL_LETTER = /[֐-ࣿיִ-﷿ﹰ-﻿]/u;

/** A Latin letter. */
const LATIN_LETTER = /[A-Za-zÀ-ɏ]/u;

/**
 * The pieces of a text to reveal.
 * @param text - the text, in the app's language
 * @returns its words, or the text alone when it mixes directions
 */
export function revealWordsOf(text: string): readonly string[] {
  const trimmed = text.trim();
  if (trimmed === "") return [];
  if (RTL_LETTER.test(trimmed) && LATIN_LETTER.test(trimmed)) return [trimmed];
  return trimmed.split(/\s+/u);
}
