/**
 * Stackra file contract:
 * Purpose: `OutputOf<T>`, the output type of an action or query instance: what its `handle` resolves to.
 * Boundary: a type only; what the pipeline and `run` resolve to for a class. Gen reads the same return type to compile
 *           the output schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: input and output are the types of `handle`).
 */

/** The resolved `handle` output of an action or query instance type. */
export type OutputOf<T> = T extends { handle(...args: never[]): Promise<infer O> } ? O : never;
