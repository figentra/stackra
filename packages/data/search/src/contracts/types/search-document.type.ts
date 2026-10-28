/**
 * Stackra file contract:
 * Purpose: `SearchDocument`, what a driver stores for one row: the text of each `@Searchable` text field, in declared
 *          order, the values of each filter field, and the scope the row belongs to.
 * Boundary: a type only, built by `Search` from a loaded row. Text arrives normalised (lower case, accents and Arabic
 *           diacritics removed, letter variants unified, words joined by single spaces), so a driver never normalises.
 *           A field's position is its weight: the first is the heaviest (Postgres `A`), the fourth and later the
 *           lightest (`D`), unless `weights` gives the field's tier (the facet's `boost`). Sortable and range fields
 *           are kept under `filters` too, so an engine sorts and bounds by the values it already stores. The scope is read from the row's own `scopeId` and `scopePath`, never from input; an engine
 *           that cannot isolate scopes in the database stores it and answers only the scopes a request names.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 1 and 3: weighted full-text, Arabic normalisation); ADR 0089 (decision 6:
 *                     every query scoped); ADR 0327 and ADR 0323 (a scope is a `ScopeRef`);
 *                     stackra-302 (weights, sortable and range values).
 */
import type { ScopeRef } from "@stackra/contracts";

import type { SearchFilterValue } from "#contracts/types/search-filter-value.type";

/** One row as a driver indexes it. */
export interface SearchDocument {
  /** The row's primary key. */
  readonly id: string;

  /** Each text field's words, or one string of words per locale tag for a translated field. */
  readonly fields: readonly (string | Readonly<Record<string, string>>)[];

  /**
   * Each text field's weight tier, 0 the heaviest (`A`) to 3 the lightest (`D`), in `fields` order; absent when every
   * field weighs by its position.
   */
  readonly weights?: readonly number[];

  /**
   * Each filter, sortable and range field's values by its path; a path through a to-many relation has several, an
   * empty one none.
   */
  readonly filters: Readonly<Record<string, readonly SearchFilterValue[]>>;

  /** The scope node the row belongs to; absent for a row of a table without scope columns. */
  readonly scope?: ScopeRef;
}
