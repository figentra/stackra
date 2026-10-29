/**
 * Stackra file contract:
 * Purpose: `AccountDeletionOutput`, what the signed-in user's account deletion calls answer: when the deletion was
 *          asked and when the account is deleted, both null when none is scheduled (after a cancel, or never asked).
 * Boundary: a schema; times are ISO 8601 strings. It never names another account.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1567.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import type { AccountDeletion, AccountDeletionState } from "#contracts/index";

/**
 * The caller's account deletion, if any.
 *
 * @example
 * return AccountDeletionOutput.from(await deletions.find(subject));
 */
export class AccountDeletionOutput extends Schema implements AccountDeletionState {
  /** When the deletion was asked; null when none is scheduled. */
  requestedAt!: string | null;

  /** When the account is deleted; null when none is scheduled. */
  dueAt!: string | null;

  /** The output for `deletion`, or the empty one. */
  static from(deletion: AccountDeletion | undefined): AccountDeletionOutput {
    return AccountDeletionOutput.create({
      requestedAt: deletion?.requestedAt.toISOString() ?? null,
      dueAt: deletion?.dueAt.toISOString() ?? null,
    });
  }
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AccountDeletionOutput,
    z.object({ requestedAt: z.string().nullable(), dueAt: z.string().nullable() }),
  ],
]);
