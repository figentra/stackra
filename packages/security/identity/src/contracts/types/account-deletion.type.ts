/**
 * Stackra file contract:
 * Purpose: `AccountDeletion`, one account deletion a user asked for and that waits out its grace period in the
 *          `AccountDeletions` store: whose account, the erasure id its erasure will carry, when it was asked and when it
 *          is due.
 * Boundary: a type only; ids are public ids. No name, email or reason is kept: the subject's `usr_` id is enough.
 * Runtime: isomorphic
 * Governing contract: App Store Review Guideline 5.1.1(v); ADR 0189 (decision 2); STA-1567.
 */
import type { PublicId } from "@stackra/contracts";

/**
 * A scheduled account deletion.
 *
 * @example
 * const deletion: AccountDeletion = { subject: "usr_01…", erasureId: "era_01…", requestedAt, dueAt };
 */
export interface AccountDeletion {
  /** The account to delete, the caller's own. */
  readonly subject: PublicId<"usr">;

  /** The id the privacy erasure and its receipt carry. */
  readonly erasureId: string;

  /** When the user asked. */
  readonly requestedAt: Date;

  /** When the grace period ends and the erasure may start. */
  readonly dueAt: Date;
}
