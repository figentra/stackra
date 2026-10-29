/**
 * Stackra file contract:
 * Purpose: `ConfirmPasskeyOutput`, what `identity.passkey.confirm@1` answers: the passkey kept.
 * Boundary: a schema.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1538.
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/** A kept passkey. */
export class ConfirmPasskeyOutput extends Schema {
  /** The provider's id of the passkey now on the account. */
  @Str({
    min: 1,
    max: 200,
  })
  passkeyId!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ConfirmPasskeyOutput, z.object({ passkeyId: z.string().min(1).max(200) })]]);
