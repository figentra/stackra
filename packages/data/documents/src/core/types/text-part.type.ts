/**
 * Stackra file contract:
 * Purpose: `TextPart`, a piece of resolved text: either template wording or a value filled into a placeholder.
 * Boundary: a type only. A value run is isolated from its neighbours for bidi (`<bdi>` in HTML), so a Latin name or a
 *           number inside Arabic wording keeps its own order.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */

/** One part of resolved text. */
export interface TextPart {
  /** The characters, in logical order. */
  readonly text: string;

  /** Whether it came from the data rather than the template. */
  readonly isValue: boolean;
}
