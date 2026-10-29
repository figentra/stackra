/**
 * Stackra file contract:
 * Purpose: `SessionLine`, one session of `SessionsOutput` as a shape: the `IdpSession` contract as a Schema class, so
 *          gen reads the field as a shape (`shape_unknown_type` otherwise).
 * Boundary: a schema implementing `IdpSession`; times are ISO 8601 strings. It never holds a token or an IP address.
 *           It registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1580.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import type { IdpSession } from "#contracts/index";

/**
 * One live identity provider session.
 *
 * @example
 * SessionLine.create({ sessionId: "s_1", createdAt, lastActiveAt, userAgent: "Safari on macOS" });
 */
export class SessionLine extends Schema implements IdpSession {
  /** The provider's session id. */
  sessionId!: string;

  /** When the session started. */
  createdAt!: string;

  /** When the session last changed. */
  lastActiveAt!: string;

  /** The device's description of itself, when the provider has one. */
  userAgent?: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    SessionLine,
    z.object({
      sessionId: z.string().min(1),
      createdAt: z.string(),
      lastActiveAt: z.string(),
      userAgent: z.string().exactOptional(),
    }),
  ],
]);
