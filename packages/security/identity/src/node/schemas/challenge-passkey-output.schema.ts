/**
 * Stackra file contract:
 * Purpose: `ChallengePasskeyOutput`, what `identity.passkey.challenge@1` answers: the provider's session and the
 *          WebAuthn request options the device signs.
 * Boundary: a schema; the options pass through unread.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1538.
 */
import { Field, registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

import type { PasskeyRequestOptions } from "#contracts/index";
import { PASSKEY_SCHEMAS } from "#node/constants/passkey-schemas.constant";

/** A started passkey sign-in. */
export class ChallengePasskeyOutput extends Schema {
  /** The provider's session the check completes. */
  @Str({
    min: 1,
    max: 200,
  })
  sessionId!: string;

  /** What the device signs. */
  // reason: the provider's WebAuthn JSON, passed to the device unread
  @Field(PASSKEY_SCHEMAS.requestOptions)
  options!: PasskeyRequestOptions;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    ChallengePasskeyOutput,
    z.object({ sessionId: z.string().min(1).max(200), options: PASSKEY_SCHEMAS.requestOptions }),
  ],
]);
