/**
 * Stackra file contract:
 * Purpose: `captionIndexOf(languages, locale)`, which captions a MediaPlayer turns on: the first track in the reader's
 *          language, else the first track. A track's language may be a two-letter code (`ar`, as WebVTT tracks
 *          carry) or a three-letter ISO 639-2 one (`ara`, as MP4 files and the platform players report), and it
 *          matches the locale's language (`ar` and `ara` both match `ar-SA`).
 * Boundary: pure; an empty list gives 0, and the caller shows nothing. The three-letter codes known are those of the
 *           seven product languages (ADR 0403); another three-letter code matches only itself.
 * Runtime: isomorphic
 * Governing contract: WCAG 2.2 SC 1.2.2; ADR 0302 (decision 3); ADR 0403; STA-1371 (owner approval 2026-10-30).
 */

/** ISO 639-2 codes (both the terminology and bibliographic forms) of the product languages, by two-letter code. */
const TWO_LETTER: Readonly<Record<string, string>> = {
  ara: "ar",
  eng: "en",
  deu: "de",
  ger: "de",
  spa: "es",
  fra: "fr",
  fre: "fr",
  ita: "it",
  nld: "nl",
  dut: "nl",
};

/** The primary language of a tag, two letters where one is known: "ara" and "ar-SA" both give "ar". */
const languageOf = (tag: string) => {
  const primary = (tag.split(/[-_]/)[0] ?? "").toLowerCase();
  return TWO_LETTER[primary] ?? primary;
};

/**
 * The index of the captions to show.
 * @example captionIndexOf(["eng", "ara"], "ar-SA"); // 1
 */
export function captionIndexOf(languages: readonly string[], locale: string): number {
  const reader = languageOf(locale);
  return Math.max(
    0,
    languages.findIndex((language) => languageOf(language) === reader),
  );
}
