/**
 * Stackra file contract:
 * Purpose: `OneTimeCodePolicy`, how a one-time code is made and checked: its length and alphabet, how long it lives
 *          and how many wrong tries it takes.
 * Boundary: a type only. The values are settings (login codes, pickup codes, verification), with any legal floor from
 *           the market pack; nothing here is a default.
 * Runtime: isomorphic
 * Governing contract: owner principle 2026-10-25 (configuration, not code); OS-184; conflict #2.
 */

/**
 * The policy of one purpose's codes.
 *
 * @example
 * const policy: OneTimeCodePolicy = settings.identity.loginCode; // { length: 6, ttlSeconds: 300, maxAttempts: 5 }
 */
export interface OneTimeCodePolicy {
  /** How many characters a code has, from 4 to 12. */
  readonly length: number;

  /** The characters a code is drawn from, each once; the ten digits when left out. */
  readonly alphabet?: string;

  /** How many seconds a code lives. */
  readonly ttlSeconds: number;

  /** How many wrong tries lock the code. */
  readonly maxAttempts: number;
}
