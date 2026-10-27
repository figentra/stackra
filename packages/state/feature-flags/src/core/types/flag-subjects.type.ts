/**
 * Stackra file contract:
 * Purpose: `FlagSubjects`, the ids a host knows about the caller, handed to `FlagReader#load` and `#watch`; the reader
 *          picks the one `FeatureFlagsConfig.targeting` names as the evaluation subject.
 * Boundary: a type only, keyed by the `FlagTargeting` codes. Ids only, never names, emails or other personal data
 *           (ADR 0071). A visitor id is `null` until analytics consent is given, so a visitor-targeted caller without
 *           consent is evaluated anonymously and nothing identifying is stored.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 3: targeting); ADR 0071 (privacy).
 */

/** The caller's ids, each `null` when there is none. */
export interface FlagSubjects {
  /** The consented analytics visitor id. */
  readonly visitor: string | null;

  /** The signed-in user's id. */
  readonly user: string | null;

  /** The active scope's id. */
  readonly scope: string | null;
}
