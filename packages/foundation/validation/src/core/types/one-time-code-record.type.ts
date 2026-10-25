/**
 * Stackra file contract:
 * Purpose: `OneTimeCodeRecord`, what is stored for an issued one-time code: its peppered HMAC (never the code), what
 *          and whom it is for, when it expires and the wrong tries so far.
 * Boundary: a type only; plain data the caller stores and passes back. The digest is hex HMAC-SHA-256 under the
 *           pepper over purpose, subject and code, so a stolen table cannot be brute-forced without the pepper and a
 *           code for one purpose or person never passes for another.
 * Runtime: isomorphic
 * Governing contract: OS-184; conflict #2; OWASP ASVS 2.7 (out-of-band verifiers).
 */

/** An issued code's stored state. */
export interface OneTimeCodeRecord {
  /** What the code is for (`login`, `pickup`, `phone_verification`). */
  readonly purpose: string;

  /** Whom or what it is for: a principal's or a record's id. */
  readonly subject: string;

  /** Hex HMAC-SHA-256 of `purpose`, `subject` and the code under the pepper. */
  readonly digest: string;

  /** When it stops being accepted. */
  readonly expiresAt: Date;

  /** Wrong tries so far. */
  readonly attempts: number;

  /** When it was accepted; set once, after which it never passes again. */
  readonly usedAt?: Date;
}
