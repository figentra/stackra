/**
 * Stackra file contract:
 * Purpose: `FlagContext`, who a `FlagProvider` evaluates flags for: the subject id and the tenant id, already chosen
 *          by the reader from the configured targeting.
 * Boundary: a type only. Ids, never names, emails or other personal data (ADR 0071); `subject: null` means an
 *           anonymous caller (no consent, nobody signed in), who gets every flag at its declared default unless the
 *           provider's values are the same for everyone.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 3: targeting); ADR 0294 (decision 15: contracts is the leaf).
 */

/** The ids a provider evaluates for. */
export interface FlagContext {
  /** The id flags are split by (a visitor, a user or a tenant); `null` when the caller is anonymous. */
  readonly subject: string | null;

  /** The active tenant's id, sent as the group of the evaluation; `null` when there is none. */
  readonly tenant: string | null;
}
