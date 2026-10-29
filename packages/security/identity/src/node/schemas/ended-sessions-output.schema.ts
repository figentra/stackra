/**
 * Stackra file contract:
 * Purpose: `EndedSessionsOutput`, what the session-ending calls (`identity.session.end@1`, `.end_all@1` and
 *          `.end_user@1`) answer: how many sessions ended.
 * Boundary: a schema; a count only, never a session id of another device.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1580.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * How many sessions ended.
 *
 * @example
 * return EndedSessionsOutput.create({ ended: await idp.endSessions(userId) });
 */
export class EndedSessionsOutput extends Schema {
  /** The number of sessions ended; 0 when there were none. */
  @Int({ min: 0 })
  ended!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[EndedSessionsOutput, z.object({ ended: z.number().int().min(0) })]]);
