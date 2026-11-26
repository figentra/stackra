/**
 * Stackra file contract:
 * Purpose: `ShowLoginPolicyInput`, the input of `identity.login_policy.read@1`: no fields, because the policy read is
 *          always the one of the caller's own tenant, which the session settles, never one named in the request.
 * Boundary: a schema with no fields.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-2817.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The input of the login policy read, which takes no fields. */
export class ShowLoginPolicyInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ShowLoginPolicyInput, z.object({})]]);
