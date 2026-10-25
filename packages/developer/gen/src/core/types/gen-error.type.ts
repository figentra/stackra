/**
 * Stackra file contract:
 * Purpose: `GenError`, one refusal gen reports: a snake_case code, where it is, what it is about and the fix, so an
 *          author or an agent can correct it without reading gen's source.
 * Boundary: a type only. Gen collects every error of a run before it stops, and writes nothing when one exists.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 22 and 26); ADR 0305 (rules 1, 6 and 13: the first gen checks); ADR 0231
 *                     (snake_case machine codes).
 */

/** One gen refusal. */
export interface GenError {
  /** The machine code, such as `shape_number_kind` or `identity_collision`. */
  readonly code: string;

  /** The file, relative to the member root. */
  readonly file: string;

  /** The 1-based line, or 0 when the error is about a whole file or the member. */
  readonly line: number;

  /** The 1-based column, or 0 when the error is about a whole file or the member. */
  readonly column: number;

  /** What the error is about: a class, `Class.field` or an identity. */
  readonly subject: string;

  /** What is wrong. */
  readonly message: string;

  /** What to write instead. */
  readonly fix: string;
}
