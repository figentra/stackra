/**
 * Stackra file contract:
 * Purpose: `FindingShape`, which object literals of a tool's source are findings for `emittedCodes`: the property
 *          that holds the code and the keys of which one must sit beside it.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0294 (decision 22: a refusal names its code and fix);
 *                     ADR 0282 (decision 3: `stackra check`); ADR 0296 (runway enforcement); STA-2853.
 */

/** Which object literals are findings: the code property, and the keys of which one must sit beside it. */
export interface FindingShape {
  /** The property that holds the code, such as `code` (gen) or `rule` (the repository checks). */
  readonly property: string;

  /** At least one of these keys sits beside it, such as `fix` (every gen refusal) or `text` and `message`. */
  readonly siblings: readonly string[];
}
