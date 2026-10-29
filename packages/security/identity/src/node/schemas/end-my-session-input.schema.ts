/**
 * Stackra file contract:
 * Purpose: `EndMySessionInput`, the input of `identity.session.end@1`: the provider id of one of the caller's own
 *          sessions, as `identity.session.list@1` listed it.
 * Boundary: a schema; whose session it is the action checks, never this schema.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1580.
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/**
 * One of the caller's sessions to end.
 *
 * @example
 * await pipeline.execute(EndMySessionAction, { sessionId: "ses_1" }, { actor });
 */
export class EndMySessionInput extends Schema {
  /** The provider's session id. */
  @Str({
    min: 1,
    max: 200,
  })
  sessionId!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[EndMySessionInput, z.object({ sessionId: z.string().min(1).max(200) })]]);
