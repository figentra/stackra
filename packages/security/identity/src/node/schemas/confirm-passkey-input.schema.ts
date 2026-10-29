/**
 * Stackra file contract:
 * Purpose: `ConfirmPasskeyInput`, what `identity.passkey.confirm@1` takes: the pending passkey, the name to keep it
 *          under and the device's new credential.
 * Boundary: a schema; the credential's shape is checked here, its attestation by the provider.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; STA-1538.
 */
import { Field, registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

import type { PasskeyCredential } from "#contracts/index";
import { PASSKEY_SCHEMAS } from "#node/constants/passkey-schemas.constant";

/** A new passkey to keep. */
export class ConfirmPasskeyInput extends Schema {
  /** The provider's id of the pending passkey. */
  @Str({
    min: 1,
    max: 200,
  })
  passkeyId!: string;

  /** The name the person sees in the account's passkey list (`iPhone`). */
  @Str({
    min: 1,
    max: 200,
  })
  name!: string;

  /** The device's new credential. */
  // reason: WebAuthn JSON whose attestation only the provider reads
  @Field(PASSKEY_SCHEMAS.credential)
  credential!: PasskeyCredential;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    ConfirmPasskeyInput,
    z.object({
      passkeyId: z.string().min(1).max(200),
      name: z.string().min(1).max(200),
      credential: PASSKEY_SCHEMAS.credential,
    }),
  ],
]);
