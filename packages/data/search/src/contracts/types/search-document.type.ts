/**
 * Stackra file contract:
 * Purpose: `SearchDocument`, what a driver stores for one row: the text of each `@Searchable` text field, in declared
 *          order, and the values of each filter field.
 * Boundary: a type only, built by `Search` from a loaded row. Text arrives normalised (lower case, accents and Arabic
 *           diacritics removed, letter variants unified, words joined by single spaces), so a driver never normalises.
 *           A field's position is its weight: the first is the heaviest (Postgres `A`), the fourth and later the
 *           lightest (`D`).
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 1 and 3: weighted full-text, Arabic normalisation).
 */
import type { SearchFilterValue } from "#contracts/types/search-filter-value.type";

/** One row as a driver indexes it. */
export interface SearchDocument {
  /** The row's primary key. */
  readonly id: string;

  /** Each text field's words, or one string of words per locale tag for a translated field. */
  readonly fields: readonly (string | Readonly<Record<string, string>>)[];

  /** Each filter field's values by its path; a path through a to-many relation has several, an empty one none. */
  readonly filters: Readonly<Record<string, readonly SearchFilterValue[]>>;
}
