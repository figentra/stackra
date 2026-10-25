/**
 * Stackra file contract:
 * Purpose: `InputOf<T>`, the input type of an action or query instance: the first parameter of its `handle`.
 * Boundary: a type only; what `run`, `ctx.dispatch` and the pipeline accept for a class. Gen reads the same parameter
 *           to compile the input schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: input and output are the types of `handle`).
 */

/** The `handle` input of an action or query instance type. */
export type InputOf<T> = T extends { handle(input: infer I, ...rest: never[]): unknown }
  ? I
  : never;
