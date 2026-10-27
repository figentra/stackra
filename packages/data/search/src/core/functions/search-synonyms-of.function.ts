/**
 * Stackra file contract:
 * Purpose: `searchSynonymsOf`, the synonyms of one index read from the `search.synonyms` setting text: each normalised
 *          word of a set mapped to the other words of every set it is in, for the sets of that index in one language
 *          (every language when none is given).
 * Boundary: pure, and only for search recall: a synonym is an extra alternative of a phrase word, never a replacement,
 *           so a set widens a search and hides nothing. Sets are equivalences (each term finds the others). Terms are
 *           normalised with `searchWordsOf`, the one normalisation of the index, so the result is safe to put in a
 *           tsquery. A line that breaks `SEARCH_SYNONYM_LINE` is skipped (the setting's schema refuses it on write).
 *           Each word gets at most `MAX_SYNONYMS` alternatives, which bounds the query one phrase can cause.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 3: normalisation shared by documents and phrases); ADR 0403 (analysers per
 *                     language); ADR 0404 (one normaliser).
 */
import { SEARCH_SYNONYM_LINE } from "#core/constants/search-synonym-line.constant";
import { searchWordsOf } from "#core/functions/search-words-of.function";

/** The most synonyms one word carries. */
const MAX_SYNONYMS = 8;

/**
 * The synonyms of each word for `indexes` (the names the index answers to: its table, bare and schema-qualified) in
 * `language`, or in every language when it is absent.
 *
 * @example
 * searchSynonymsOf("products en: sofa, couch, settee", ["products"], "en").get("couch"); // ["sofa", "settee"]
 */
export function searchSynonymsOf(
  text: string,
  indexes: readonly string[],
  language?: string,
): ReadonlyMap<string, readonly string[]> {
  const synonyms = new Map<string, Set<string>>();
  for (const line of text.split("\n")) {
    const [, index, lineLanguage, terms] = SEARCH_SYNONYM_LINE.exec(line) ?? [];
    if (index === undefined || terms === undefined || !indexes.includes(index)) continue;
    if (language !== undefined && lineLanguage !== language) continue;
    // shortcut: a term that normalises to several words (`t shirt`) is left out, since a phrase matches word by word;
    // add phrase synonyms when a merchant needs them.
    const words = [
      ...new Set(
        terms.split(",").flatMap((term) => {
          const normalised = searchWordsOf(term);
          return normalised.length === 1 ? normalised : [];
        }),
      ),
    ];
    for (const word of words) {
      const known = synonyms.get(word) ?? new Set<string>();
      for (const other of words) if (other !== word) known.add(other);
      synonyms.set(word, known);
    }
  }
  return new Map(
    [...synonyms]
      .filter(([, others]) => others.size > 0)
      .map(([word, others]) => [word, [...others].slice(0, MAX_SYNONYMS)]),
  );
}
