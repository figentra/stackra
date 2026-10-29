/**
 * Stackra file contract:
 * Purpose: `PASSKEY_SCHEMAS`, the Zod schemas of the WebAuthn JSON the passkey actions carry: the device's credential
 *          (checked for its shape, its signed `response` left to the provider) and the provider's request and creation
 *          options (passed through to the device unread).
 * Boundary: constants only, shared by the passkey input and output schemas through `@Field`. The credential arrives
 *           from an anonymous caller, so its ids are bounded; the provider verifies the signature.
 * Runtime: node
 * Governing contract: ADR 0095 (the `@Field` escape hatch); W3C WebAuthn Level 3 (§ 5.1); STA-1538.
 */
import { z } from "zod";

import type {
  PasskeyCreationOptions,
  PasskeyCredential,
  PasskeyRequestOptions,
} from "#contracts/index";

/** The longest credential id accepted, in base64url characters. */
const MAX_ID = 1024;

/** Whether `value` is a non-null object. */
const isObject = (value: unknown): boolean => typeof value === "object" && value !== null;

/**
 * The passkey JSON schemas.
 *
 * @example
 * const parsed = PASSKEY_SCHEMAS.credential.safeParse(body.credential);
 */
export const PASSKEY_SCHEMAS = Object.freeze({
  /** A `PublicKeyCredential` JSON from the device. */
  credential: z.custom<PasskeyCredential>((value) => {
    const credential = value as Partial<PasskeyCredential> | null;
    return (
      typeof credential?.id === "string" &&
      credential.id !== "" &&
      credential.id.length <= MAX_ID &&
      typeof credential.rawId === "string" &&
      credential.rawId.length <= MAX_ID &&
      credential.type === "public-key" &&
      isObject(credential.response)
    );
  }),
  /** The provider's sign-in options. */
  requestOptions: z.custom<PasskeyRequestOptions>(isObject),
  /** The provider's registration options. */
  creationOptions: z.custom<PasskeyCreationOptions>(isObject),
});
