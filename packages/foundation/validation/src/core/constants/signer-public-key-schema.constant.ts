/**
 * Stackra file contract:
 * Purpose: `SIGNER_PUBLIC_KEY_SCHEMA`, the shipped `SignerPublicKey$`: a key id, the `ES256` algorithm and the DER
 *          SubjectPublicKeyInfo as unpadded base64url.
 * Boundary: shape only; it never imports the key. `SignerPublicKey` is @stackra/contracts', which has no zod, so its
 *           `X$` ships here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0416; STA-1284.
 */
import type { SignerPublicKey } from "@stackra/contracts";
import { z } from "zod";

/** The shipped `SignerPublicKey$`. */
export const SIGNER_PUBLIC_KEY_SCHEMA: z.ZodType<SignerPublicKey> = z.object({
  keyId: z.string().min(1),
  algorithm: z.literal("ES256"),
  spki: z.string().regex(/^[A-Za-z0-9_-]+$/),
});
