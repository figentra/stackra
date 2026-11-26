/**
 * Stackra file contract:
 * Purpose: `ContractBreak`, one breaking change `oasdiff breaking` reports between two OpenAPI documents.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: `oasdiff` contract checks); STA-2837.
 */

/** One change of `oasdiff breaking --format json`. */
export type ContractBreak = {
  /** The rule id (`api-path-removed-without-deprecation`, `request-property-became-required`). */
  readonly id: string;

  /** The level: 3 is an error, 2 a warning, 1 information. */
  readonly level: number;

  /** The upper-case method of the operation. */
  readonly operation: string;

  /** The path, with `{param}` segments. */
  readonly path: string;

  /** What changed, one line. */
  readonly text: string;
};
