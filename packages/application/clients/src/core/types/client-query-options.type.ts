/**
 * Stackra file contract:
 * Purpose: `ClientQueryOptions<I, O>`, the one argument of `ClientQuery({...})`: the query ref options with the key
 *          inside.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3); ADR 0305 (kind factories take no `define` prefix).
 */
import type { QueryRefOptions } from "#core/types/query-ref-options.type";
import type { RefSchema } from "#core/types/ref-schema.type";

/** What `ClientQuery` declares. */
export interface ClientQueryOptions<
  I extends RefSchema,
  O extends RefSchema,
> extends QueryRefOptions<I, O> {
  /** The query key (`sites.site.resolve`). */
  readonly key: string;
}
