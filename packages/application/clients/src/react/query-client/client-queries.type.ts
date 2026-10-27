/**
 * Stackra file contract:
 * Purpose: `ClientQueries`, what `useQueryClient` returns: fetch a consumed query outside a render (a scanner lookup)
 *          through the cache, and mark a query's cached answers stale.
 * Boundary: a type only. Both go through the same cache keys as `useQuery`, so a fetched answer is the one a screen
 *           shows.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (TanStack Query core); ADR 0260 (decision 4).
 */
import type { QueryRef } from "#core/types/query-ref.type";
import type { RefInput } from "#core/types/ref-input.type";
import type { RefOutput } from "#core/types/ref-output.type";

/** Imperative access to consumed queries. */
export interface ClientQueries {
  /**
   * The answer of `query` for `input`: the cached one while fresh, else a new fetch.
   *
   * @throws ClientError the producer's refusal, or a `TransportError`.
   */
  fetch<Q extends QueryRef>(query: Q, input: RefInput<Q>): Promise<RefOutput<Q>>;

  /** Marks the cached answers of `query` stale (for `input` only, when given); those on screen refetch. */
  invalidate<Q extends QueryRef>(query: Q, input?: RefInput<Q>): Promise<void>;
}
