/**
 * Stackra file contract:
 * Purpose: `EraseDueAccountsOutput`, the output of the `identity.account_deletion.erase@1` job: how many due account
 *          deletions it started and how many a legal hold deferred.
 * Boundary: a shape class in its own file; counts only, never an id.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4 and 13); STA-1567.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** What one run of the job did. */
export class EraseDueAccountsOutput extends Schema {
  /** Erasures queued. */
  @Int({ min: 0 })
  started!: number;

  /** Due deletions a legal hold deferred to a later run. */
  @Int({ min: 0 })
  held!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    EraseDueAccountsOutput,
    z.object({ started: z.number().int().min(0), held: z.number().int().min(0) }),
  ],
]);
