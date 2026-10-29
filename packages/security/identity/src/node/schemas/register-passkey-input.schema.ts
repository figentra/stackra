/**
 * Stackra file contract:
 * Purpose: `RegisterPasskeyInput`, the input of `identity.passkey.register@1`: no fields, because the account is the
 *          caller's own, never one named in the body.
 * Boundary: a schema with no fields.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1538.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The input of a passkey registration start, which takes no fields. */
export class RegisterPasskeyInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[RegisterPasskeyInput, z.object({})]]);
