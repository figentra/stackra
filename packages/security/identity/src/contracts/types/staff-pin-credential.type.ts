/**
 * Stackra file contract:
 * Purpose: `StaffPinCredential`, a staff member's PIN on one shared device: the PBKDF2 hash with its salt and
 *          iterations, the failed attempts in a row, and the lockout end.
 * Boundary: a type only. The PIN itself is never stored; the hash is bound to one device principal, so a PIN works only
 *           on the till it was set on (ADR 0361 decision 8). It is kept where the platform protects secrets.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decisions 7 and 8); owner round 3 #15 (staff PIN quick-switch).
 */
import type { PublicId } from "@stackra/contracts";

/** One staff PIN on one device. */
export interface StaffPinCredential {
  /** The device principal the PIN is bound to. */
  readonly device: PublicId;

  /** The staff principal it signs in. */
  readonly principal: PublicId;

  /** The PBKDF2-SHA-256 hash, base64url. */
  readonly hash: string;

  /** The salt, base64url. */
  readonly salt: string;

  /** The PBKDF2 iterations the hash used. */
  readonly iterations: number;

  /** Wrong PINs in a row since the last right one. */
  readonly failures: number;

  /** No attempt is checked before this instant; absent when not locked. */
  readonly lockedUntil?: Date;
}
