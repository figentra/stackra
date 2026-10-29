/**
 * Stackra file contract:
 * Purpose: the `AccountDeletions` port: where the account deletions users asked for wait out their grace period: write
 *          one, read a subject's, remove it (cancelled or started), and list the due ones for the job.
 * Boundary: an abstract class that is its own token; storage only. The rules (only one's own account, the step-up, the
 *           grace period, the hold check, starting the erasure) are the `./node` account deletion actions'. One
 *           deletion per subject in the session's partition. Drivers: `memory` (tests, previews) and `postgres`
 *           (`./node`'s `PostgresAccountDeletionsDriver`, migration `identity.0001`).
 * Runtime: isomorphic
 * Governing contract: App Store Review Guideline 5.1.1(v); ADR 0263 (ports and drivers); STA-1567.
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { AccountDeletion } from "#contracts/types/account-deletion.type";

/**
 * Keeps scheduled account deletions.
 *
 * @example
 * const due = await deletions.due(ctx.now(), 100);
 */
export abstract class AccountDeletions extends Port {
  /** Writes `deletion`, replacing the subject's one. */
  abstract put(deletion: AccountDeletion): Promise<void>;

  /** The subject's scheduled deletion, or `undefined`. */
  abstract find(subject: PublicId<"usr">): Promise<AccountDeletion | undefined>;

  /** Removes the subject's deletion; `false` when there was none. */
  abstract remove(subject: PublicId<"usr">): Promise<boolean>;

  /** At most `limit` deletions due at `now`, the oldest due first. */
  abstract due(now: Date, limit: number): Promise<readonly AccountDeletion[]>;
}
