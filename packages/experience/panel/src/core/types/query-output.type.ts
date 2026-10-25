/**
 * Stackra file contract:
 * Purpose: `QueryOutput<Q>`, the output of a query class: what a server query's `handle` resolves to, or the output schema of
 *          a consumed query ref.
 * Boundary: a type only, over the class (the value).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: input and output are the types of `handle`); ADR 0260 (decision 3: refs).
 */
import type { OutputOf } from "@stackra/actions";
import type { output, ZodType } from "zod";

/** The output of query class `Q`. */
export type QueryOutput<Q> = Q extends { readonly output: infer S extends ZodType }
  ? output<S>
  : Q extends abstract new (...args: never[]) => infer I
    ? OutputOf<I>
    : never;
