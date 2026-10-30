/**
 * Stackra file contract:
 * Purpose: `GrantCoverage`, how many of a set of permissions some roles hold, as a bulk checkbox and a summary read it.
 * Boundary: a type only, in its own file; internal to the package.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */

/** The coverage of a set of permissions. */
export interface GrantCoverage {
  /** How many of the role-permission pairs are granted. */
  readonly count: number;
  /** How many pairs there are. */
  readonly total: number;
  /** True when every pair is granted (and there is at least one). */
  readonly isAll: boolean;
  /** True when some, but not all, are granted: a bulk checkbox's dash. */
  readonly isSome: boolean;
}
