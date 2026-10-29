/**
 * Stackra file contract:
 * Purpose: `VerifyPasskeyOutput`, what `identity.passkey.verify@1` answers: the verified provider session, which the
 *          host's BFF turns into its own session.
 * Boundary: a schema; the token is a bearer secret, never logged.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; ADR 0206 (decision 7); STA-1538.
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/** A verified provider session. */
export class VerifyPasskeyOutput extends Schema {
  /** The provider's session id. */
  @Str({
    min: 1,
    max: 200,
  })
  sessionId!: string;

  /** The provider's session token; a secret. */
  @Str({
    min: 1,
    max: 4000,
  })
  sessionToken!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    VerifyPasskeyOutput,
    z.object({ sessionId: z.string().min(1).max(200), sessionToken: z.string().min(1).max(4000) }),
  ],
]);
