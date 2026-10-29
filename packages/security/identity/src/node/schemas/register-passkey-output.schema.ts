/**
 * Stackra file contract:
 * Purpose: `RegisterPasskeyOutput`, what `identity.passkey.register@1` answers: the pending passkey's id and the
 *          WebAuthn creation options the device answers.
 * Boundary: a schema; the options pass through unread.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1538.
 */
import { Field, registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

import type { PasskeyCreationOptions } from "#contracts/index";
import { PASSKEY_SCHEMAS } from "#node/constants/passkey-schemas.constant";

/** A started passkey registration. */
export class RegisterPasskeyOutput extends Schema {
  /** The provider's id of the pending passkey. */
  @Str({
    min: 1,
    max: 200,
  })
  passkeyId!: string;

  /** What the device creates. */
  // reason: the provider's WebAuthn JSON, passed to the device unread
  @Field(PASSKEY_SCHEMAS.creationOptions)
  options!: PasskeyCreationOptions;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    RegisterPasskeyOutput,
    z.object({ passkeyId: z.string().min(1).max(200), options: PASSKEY_SCHEMAS.creationOptions }),
  ],
]);
