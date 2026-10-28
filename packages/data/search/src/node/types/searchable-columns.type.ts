/**
 * Stackra file contract:
 * Purpose: `SearchableColumns`, what a migration passes `t.searchable(...)`: the facet's text and filter fields as
 *          literals, and the locales a translated model is searched in.
 * Boundary: a type only. The field lists are the `@Searchable` facet's at the time the migration was written, so the
 *           columns' comments record them and gen can compare them with the facet; the macro writes no column per
 *           field. Without `locales` the table gets one `search_vector`; with them one `search_vector_<locale>` each.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (macros take literals); ADR 0221 (decisions 1 and 3).
 */

/** The arguments of `t.searchable(...)`. */
export interface SearchableColumns {
  /** The text fields, in weight order, as the facet lists them; at least one. */
  readonly text: readonly string[];

  /** The filter fields, as the facet lists them. */
  readonly filters?: readonly string[];

  /** The locale tags of a translated model (`["en", "ar"]`), one weighted vector each; distinct. */
  readonly locales?: readonly string[];

  /**
   * The index version these columns hold (ADR 0221 d7): absent for the live columns, a whole number from 2 for the
   * shadow columns of a versioned rebuild (`search_vector__v2`, `search_text__v2`, `search_filters__v2`), which the
   * expand migration adds beside the live ones and the contract migration renames over them.
   */
  readonly version?: number;
}
