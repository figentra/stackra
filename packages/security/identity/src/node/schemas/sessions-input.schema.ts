/**
 * Stackra file contract:
 * Purpose: `SessionsInput`, the input of the caller's own session calls that act on all of them
 *          (`identity.session.list@1`, `identity.session.end_all@1`): no fields, because the sessions are always the
 *          caller's own, never a user named in the body.
 * Boundary: a schema with no fields.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1580.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The input of a call on all of the caller's sessions, which takes no fields. */
export class SessionsInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[SessionsInput, z.object({})]]);
