/**
 * Stackra file contract:
 * Purpose: `QueryOutput<Q>`, the decoded answer of a consumed query, for props and state that hold it (a block's
 *          `data`).
 * Boundary: a type only; the query-named form of `RefOutput`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3).
 */
import type { QueryRef } from "#core/types/query-ref.type";
import type { RefOutput } from "#core/types/ref-output.type";

/**
 * The answer of the query `Q`.
 *
 * @example
 * readonly data: QueryOutput<typeof ListPlansQuery>;
 */
export type QueryOutput<Q extends QueryRef> = RefOutput<Q>;
