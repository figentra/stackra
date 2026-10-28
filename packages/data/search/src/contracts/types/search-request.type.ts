/**
 * Stackra file contract:
 * Purpose: `SearchRequest`, what `Search` asks a driver: the normalised words of the phrase, the exact filter values,
 *          the slice of the ranked result, and the scope paths the session may read.
 * Boundary: a type only. With `vector`, a row whose passages are near it also ranks (a third lane, fused by
 *           reciprocal rank), and empty `words` mean the vector lane alone (a semantic read). Every word must match (as a word prefix, or as text for a fuzzy engine), itself or one of its
 *           alternatives; every filter must hold its value among its stored values; only visible rows are ranked.
 *           `words` is empty only beside a `vector`, and its words are distinct. `scopePaths` comes from the scope session
 *           (`app.scope_paths`), never from input.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 1 and 3: hybrid search, Arabic); ADR 0333 (amendment: visibility bounds
 *                     search); OS-173 (Arabizi); ADR 0403 (synonyms per language); ADR 0089 (decision 6: every query
 *                     scoped); ADR 0327 (decision 9); stackra-301 (the vector lane).
 */
import type { SearchFilterValue } from "#contracts/types/search-filter-value.type";
import type { SearchVector } from "#contracts/types/search-vector.type";

/** One ranked read. */
export interface SearchRequest {
  /** The phrase's distinct words, normalised as documents are; empty only for a semantic read (`vector` alone). */
  readonly words: readonly string[];

  /** The filter paths and the value each must hold. */
  readonly filters: Readonly<Record<string, SearchFilterValue>>;

  /** How many ranked ids to skip. */
  readonly offset: number;

  /** How many ranked ids to return at most. */
  readonly limit: number;

  /**
   * Other spellings of a word, any of which may match in its place in every lane (the Arabic spelling of an Arabizi
   * word, the other words of its synonym sets), normalised as documents are; a word with no entry matches only as
   * itself.
   */
  readonly alternatives?: Readonly<Record<string, readonly string[]>>;

  /**
   * The parameterised SQL subquery of the primary keys the caller may see (record visibility, ADR 0333), which a SQL
   * engine applies inside every lane before it ranks; absent when every row in the session is visible. An engine that
   * cannot apply it refuses the request rather than rank rows the caller may not see.
   */
  readonly visible?: { readonly sql: string; readonly params: readonly unknown[] };

  /**
   * The scope paths the session was granted, for an engine that does not isolate scopes in the database
   * (`SearchDriver.isolatesScopes` false): only a document whose scope path is one of them or below one counts, and
   * a document without a scope always counts. Absent when the session holds no scope (a platform read) or the engine
   * isolates scopes itself (Postgres row-level security); empty when the session was granted none, so no scoped
   * document counts.
   */
  readonly scopePaths?: readonly string[];

  /**
   * The phrase's embedding, for a driver that fuses vectors (`SearchDriver.fusesVectors`): its nearest passages rank
   * their rows in a third lane, under the same filters and visibility. Absent for a lexical read; a driver that does
   * not fuse vectors never receives it.
   */
  readonly vector?: SearchVector;
}
