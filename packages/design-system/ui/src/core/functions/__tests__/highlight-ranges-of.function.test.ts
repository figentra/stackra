/**
 * Stackra file contract:
 * Purpose: proves `highlightRangesOf` matches ignoring case, Arabic diacritics, tatweel and letter variants, keeps the
 *          diacritics after a match inside it, maps offsets back to the original text, and merges overlaps.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { highlightRangesOf } from "#core/functions/highlight-ranges-of.function";

const cut = (text: string, terms: string | readonly string[]) =>
  highlightRangesOf(text, terms).map(({ start, end }) => text.slice(start, end));

describe("highlightRangesOf", () => {
  it("ignores case", () => {
    expect(cut("Riyadh and RIYADH", "riyadh")).toEqual(["Riyadh", "RIYADH"]);
  });

  it("matches Arabic without diacritics and keeps the marks inside the match", () => {
    expect(cut("مُحَمَّدٌ في الرياض", "محمد")).toEqual(["مُحَمَّدٌ"]);
  });

  it("folds alef, yaa and taa marbuta variants and tatweel", () => {
    expect(cut("أحمد مستشفى مدرسة الـريـاض", ["احمد", "مستشفي", "مدرسه", "الرياض"])).toEqual([
      "أحمد",
      "مستشفى",
      "مدرسة",
      "الـريـاض",
    ]);
  });

  it("merges overlapping terms and ignores empty ones", () => {
    expect(cut("Jeddah Corniche", ["jedd", "dah c", " "])).toEqual(["Jeddah C"]);
  });
});
