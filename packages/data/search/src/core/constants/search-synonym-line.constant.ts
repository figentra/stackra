/**
 * Stackra file contract:
 * Purpose: `SEARCH_SYNONYM_LINE`, the form of one line of the `search.synonyms` setting: a blank line, a `#` comment,
 *          or one synonym set `<index> <language>: term, term[, term...]` (`products en: sofa, couch, settee`).
 * Boundary: internal to this package. `SearchSettings`' schema checks every stored line against it, and
 *           `searchSynonymsOf` reads the sets with its groups (1 index, 2 language, 3 terms). The index is the model's
 *           table, bare or schema-qualified (`products`, `catalogue.products`); the language is a primary subtag.
 *           A term holds no comma or `#`.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 3: language-aware search); ADR 0403 (analysers per language); ADR 0307
 *                     (rules 22 to 24: runtime values are settings).
 */

/** One line of the synonyms setting; a set line captures its index, language and comma-separated terms. */
export const SEARCH_SYNONYM_LINE =
  /^\s*(?:#.*)?$|^\s*([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?)\s+([a-z]{2,3})\s*:\s*([^,#]+(?:,[^,#]+)+)$/u;
