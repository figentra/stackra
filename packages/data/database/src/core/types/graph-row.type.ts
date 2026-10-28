/**
 * Stackra file contract:
 * Purpose: `GraphRow<M, R, F>`, one row of a graph read: the source row under its key in `F`, the related row under the
 *          relation's key `R`.
 * Boundary: a type only; the related type is what the relation's `load()` resolves to (a `Link<T>` or a `Ref<T>`).
 * Runtime: node
 * Governing contract: ADR 0104 (decision 2); ADR 0294 (decision 28: links).
 */

/** The row a relation value loads. */
type Related<V> = V extends { load: () => Promise<infer T> } ? T : never;

/** One graph row. */
export type GraphRow<M extends object, R extends keyof M, F> = {
  readonly [K in keyof F]: K extends R ? Related<NonNullable<M[R]>> : M;
};
