/**
 * Stackra file contract:
 * Purpose: `VerifyPasskeyInput`, what `identity.passkey.verify@1` takes: the session of the challenge and the device's
 *          signed credential.
 * Boundary: a schema; the credential's shape is checked here, its signature by the provider.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1538.
 */
import { Field, registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

import type { PasskeyCredential } from "#contracts/index";
import { PASSKEY_SCHEMAS } from "#node/constants/passkey-schemas.constant";

/** A passkey sign-in to check. */
export class VerifyPasskeyInput extends Schema {
  /** The provider's session from the challenge. */
  @Str({
    min: 1,
    max: 200,
  })
  sessionId!: string;

  /** The device's signed credential. */
  // reason: WebAuthn JSON whose signed response only the provider reads
  @Field(PASSKEY_SCHEMAS.credential)
  credential!: PasskeyCredential;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    VerifyPasskeyInput,
    z.object({ sessionId: z.string().min(1).max(200), credential: PASSKEY_SCHEMAS.credential }),
  ],
]);
