/**
 * Stackra file contract:
 * Purpose: `OneTimeCodeCheck`, the outcome of `oneTimeCode.verify`: accepted or the reason it was refused, and the
 *          record the service writes back (used, or one attempt fewer).
 * Boundary: a type only. The reason is for logs and metrics; a caller shows a user one generic refusal.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ACA-538; STA-934; STA-1383 (record
 *                     renamed `KeyedOneTimeCodeRecord`).
 */
import type { KeyedOneTimeCodeRecord } from "#core/types/keyed-one-time-code-record.type";

/** The verify outcome and the record to store next. */
export interface OneTimeCodeCheck {
  /** Whether the code was accepted; it is accepted at most once. */
  readonly ok: boolean;

  /** Why it was refused; absent when accepted. */
  readonly reason?: "used" | "expired" | "locked" | "unknown_key" | "mismatch";

  /** The record to store in place of the one passed in. */
  readonly record: KeyedOneTimeCodeRecord;
}
