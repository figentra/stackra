/**
 * Stackra file contract:
 * Purpose: `TEXT_SEARCH_CONFIGS`, the Postgres text search configuration (its Snowball stemmer) per language subtag,
 *          which the Postgres driver writes and reads a `search_vector_<locale>` column with.
 * Boundary: data only, internal to this package. The names are the configurations every Postgres 13 or later ships;
 *           a language not listed, and the locale-free `search_vector`, use `simple` (no stemming). The driver inlines
 *           these names into its SQL, so this closed list is the only source of them.
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 1 and 3: full-text search, Arabic stemming); ADR 0403 (the seven
 *                     languages, `es`, `it` and `nl` included, and their reindex plan).
 */

/** Language subtag to text search configuration. */
export const TEXT_SEARCH_CONFIGS: Readonly<Record<string, string>> = Object.freeze({
  ar: "arabic",
  da: "danish",
  de: "german",
  el: "greek",
  en: "english",
  es: "spanish",
  fi: "finnish",
  fr: "french",
  hu: "hungarian",
  id: "indonesian",
  it: "italian",
  nl: "dutch",
  no: "norwegian",
  pt: "portuguese",
  ro: "romanian",
  ru: "russian",
  sv: "swedish",
  tr: "turkish",
});
