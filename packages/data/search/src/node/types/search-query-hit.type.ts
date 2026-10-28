/**
 * Stackra file contract:
 * Purpose: `SearchQueryHit`, one row a generated search query (`<model>.search`) answers with: its public key, the text
 *          a result list shows as its title and, when one matched, the excerpt around the phrase.
 * Boundary: a type only. The title is the model's first `@Searchable` text field that is not a dotted path, read in the
 *           call's locale; the snippet obeys `SearchSnippet.NoSnippet` as `SearchIndex.snippets` does. Never the row:
 *           a palette or a public widget gets these three fields and opens the record through its own route.
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 4 and 6, settled 2026-10-29); ADR 0341 (decision 2: the `search` effect).
 */

/** One hit of a model's search query. */
export interface SearchQueryHit {
  /** The row's primary key, as text. */
  readonly id: string;

  /** The text a result list shows for the row; the key when its title field is empty. */
  readonly title: string;

  /** The excerpt around the first word of the phrase the row contains; absent when no snippet field matched. */
  readonly snippet?: string | undefined;
}
