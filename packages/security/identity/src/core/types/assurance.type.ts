/**
 * Stackra file contract:
 * Purpose: `Assurance`, what a verified token says about its last authentication: the level the methods reached and
 *          when it happened.
 * Boundary: a type only, `assuranceOf`'s answer; either part is `undefined` when the token does not say.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (decision 1).
 */
import type { AssuranceLevel } from "#core/enums/assurance-level.enum";

/** A session's assurance. */
export interface Assurance {
  /** The strongest level the authentication methods reached. */
  readonly level: AssuranceLevel | undefined;

  /** When the user last authenticated. */
  readonly authenticatedAt: Date | undefined;
}
