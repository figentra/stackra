/**
 * Stackra file contract:
 * Purpose: `MemoryAccountDeletionsDriver`, an `AccountDeletions` held in memory, for tests, previews and `stackra dev`.
 * Boundary: process-local, so a deletion scheduled on one instance is unknown to another and a restart forgets it; a
 *           host binds `./node`'s `PostgresAccountDeletionsDriver`. One deletion per subject.
 * Runtime: isomorphic
 * Governing contract: STA-1567; ADR 0266 (memory drivers first); ADR 0263.
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { AccountDeletions } from "#contracts/index";
import type { AccountDeletion } from "#contracts/index";

/**
 * Scheduled account deletions in memory.
 *
 * @example
 * const deletions = new MemoryAccountDeletionsDriver();
 * await deletions.put({ subject, erasureId, requestedAt, dueAt });
 */
export class MemoryAccountDeletionsDriver extends Driver(AccountDeletions) {
  /** Subject to its deletion. */
  private readonly deletions = new Map<string, AccountDeletion>();

  /** Stores `deletion`, replacing the subject's one. */
  put(deletion: AccountDeletion): Promise<void> {
    this.deletions.set(deletion.subject, deletion);
    return Promise.resolve();
  }

  /** The subject's deletion, or `undefined`. */
  find(subject: PublicId<"usr">): Promise<AccountDeletion | undefined> {
    return Promise.resolve(this.deletions.get(subject));
  }

  /** Removes the subject's deletion. */
  remove(subject: PublicId<"usr">): Promise<boolean> {
    return Promise.resolve(this.deletions.delete(subject));
  }

  /** The due deletions, oldest due first. */
  due(now: Date, limit: number): Promise<readonly AccountDeletion[]> {
    return Promise.resolve(
      [...this.deletions.values()]
        .filter((deletion) => deletion.dueAt.getTime() <= now.getTime())
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
        .slice(0, limit),
    );
  }
}
