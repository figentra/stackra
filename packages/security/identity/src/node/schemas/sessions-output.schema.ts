/**
 * Stackra file contract:
 * Purpose: `SessionsOutput`, what `identity.session.list@1` answers: the caller's live identity provider sessions,
 *          each with its id, when it started and was last used, and the device's description of itself.
 * Boundary: a schema; times are ISO 8601 strings. It never holds a token or an IP address.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1580.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import type { SessionLine } from "#node/schemas/session-line.schema";

/**
 * The caller's live sessions.
 *
 * @example
 * return SessionsOutput.create({ sessions: await idp.listSessions(userId) });
 */
export class SessionsOutput extends Schema {
  /** The live sessions, as the provider lists them. */
  sessions!: SessionLine[];
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    SessionsOutput,
    z.object({
      sessions: z.array(
        z.object({
          sessionId: z.string().min(1),
          createdAt: z.string(),
          lastActiveAt: z.string(),
          userAgent: z.string().exactOptional(),
        }),
      ),
    }),
  ],
]);
