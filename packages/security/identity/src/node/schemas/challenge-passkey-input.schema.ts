/**
 * Stackra file contract:
 * Purpose: `ChallengePasskeyInput`, what `identity.passkey.challenge@1` takes: the login name to sign in.
 * Boundary: a schema; personal data, never logged.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1538.
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/** A passkey sign-in to start. */
export class ChallengePasskeyInput extends Schema {
  /** The login name (username or email) the person typed. */
  @Str({
    min: 1,
    max: 255,
  })
  loginName!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ChallengePasskeyInput, z.object({ loginName: z.string().min(1).max(255) })]]);
