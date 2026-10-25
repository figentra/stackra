/**
 * Stackra file contract:
 * Purpose: `QueryInput<Q>`, the input of a query class: the first parameter of a server query's `handle`, or the input
 *          schema of a consumed query ref.
 * Boundary: a type only, over the class (the value), so a block or a relation can name the query it runs.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: input and output are the types of `handle`); ADR 0260 (decision 3: refs).
 */
import type { InputOf } from "@stackra/actions";
import type { input, ZodType } from "zod";

/** The input of query class `Q`. */
export type QueryInput<Q> = Q extends { readonly input: infer S extends ZodType }
  ? input<S>
  : Q extends abstract new (...args: never[]) => infer I
    ? InputOf<I>
    : never;
