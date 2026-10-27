/**
 * Stackra file contract:
 * Purpose: `KeyedOneTimeCodeRecord`, what a service stores for an issued one-time code (a safe-pickup code): a peppered
 *          HMAC of the code, never the code, with its key id, expiry, attempts left and when it was used.
 * Boundary: a plain, JSON-safe value. The service persists it and writes back the record each verify returns, with a
 *           compare-and-set on its store so two concurrent verifies cannot both pass. Named for its key id, so it is not
 *           `@stackra/validation`'s `OneTimeCodeRecord` (purpose- and subject-bound login codes, OS-184).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ACA-538; STA-934; STA-1383 (unique public names).
 */

/** A stored one-time code. */
export interface KeyedOneTimeCodeRecord {
  /** The id of the key whose HMAC peppers the code. */
  readonly keyId: string;

  /** The HMAC-SHA-256 of the purpose and code, base64url. */
  readonly digest: string;

  /** When the code stops working, ISO 8601 UTC. */
  readonly expiresAt: string;

  /** Wrong guesses still allowed. */
  readonly attemptsLeft: number;

  /** When the code was accepted, ISO 8601 UTC, or `null` while unused. */
  readonly usedAt: string | null;
}
