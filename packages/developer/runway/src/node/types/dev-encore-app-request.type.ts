/**
 * Stackra file contract:
 * Purpose: `DevEncoreAppRequest`, what `syncDevEncoreApp` and `syncDevEncoreMember` take: the repository root and the
 *          absolute roots of the service members the local monolith app holds.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 3); STA-2840.
 */

/** The repository and the service members of its local monolith app. */
export type DevEncoreAppRequest = {
  /** The repository root; the app is written under its `.stackra/dev/encore`. */
  readonly repository: string;

  /** The absolute root of every service member the app holds. */
  readonly members: readonly string[];
};
