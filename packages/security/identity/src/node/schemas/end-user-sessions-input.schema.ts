/**
 * Stackra file contract:
 * Purpose: `EndUserSessionsInput`, the input of the administrator's `identity.session.end_user@1`: the Stackra user
 *          (`usr_…`) whose every session ends.
 * Boundary: a schema; the provider's user is found by this id in the action, never named directly.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1580.
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/**
 * The user to sign out everywhere.
 *
 * @example
 * await pipeline.execute(EndUserSessionsAction, { subject: "usr_1" }, { actor });
 */
export class EndUserSessionsInput extends Schema {
  /** The Stackra user id (`usr_…`). */
  @Str({
    min: 1,
    max: 200,
  })
  subject!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[EndUserSessionsInput, z.object({ subject: z.string().min(1).max(200) })]]);
