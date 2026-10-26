/**
 * Stackra file contract:
 * Purpose: `SIGNATURE_SCHEMA`, the shipped `Signature$`: a key id, the `ES256` algorithm and the 64-byte `r || s`
 *          value as unpadded base64url (86 characters).
 * Boundary: shape only; it never verifies. `Signature` is @stackra/contracts', which has no zod, so its `X$` ships
 *           here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0212 (decision 3); ADR 0416; STA-1284.
 */
import type { Signature } from "@stackra/contracts";
import { z } from "zod";

/** The shipped `Signature$`. */
export const SIGNATURE_SCHEMA: z.ZodType<Signature> = z.object({
  keyId: z.string().min(1),
  algorithm: z.literal("ES256"),
  value: z.string().regex(/^[A-Za-z0-9_-]{86}$/),
});
