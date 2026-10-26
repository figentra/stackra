/**
 * Stackra file contract:
 * Purpose: `AccountNotes`, the shape of the merchant notes jsonb column on a loyalty account.
 * Boundary: a shape class, a nested element type of the model, so it lives in schemas; node-only because only the model
 *           reads it. Validated on write, parsed on read. It registers its schema when the module loads (STA-339
 *           replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file).
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/**
 * Free-form notes staff leave when flagging an account; both fields are optional.
 *
 * @example
 * account.notes = AccountNotes.create({ reason: "review" });
 */
export class AccountNotes extends Schema {
  /** Why it was flagged. */
  @Str({ max: 500 })
  reason?: string;

  /** The staff member who flagged the account. */
  flaggedBy?: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    AccountNotes,
    z.object({ flaggedBy: z.string().optional(), reason: z.string().max(500).optional() }),
  ],
]);
