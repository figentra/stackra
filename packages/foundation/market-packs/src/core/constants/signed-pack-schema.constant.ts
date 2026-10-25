/**
 * Stackra file contract:
 * Purpose: `SIGNED_PACK_SCHEMA`, the zod schema of `SignedPack` (its `X$`): a market pack as it ships, with the SHA-256
 *          hash of its canonical JSON and an Ed25519 signature of that hash by a named key.
 * Boundary: shape only; `verifyPack` checks the hash and the signature. The hash is 64 lowercase hex characters; the
 *           signature value is base64.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 2).
 */
import { z } from "zod";

import { MARKET_PACK_SCHEMA } from "#core/constants/market-pack-schema.constant";

/** The shipped `SignedPack$`. */
export const SIGNED_PACK_SCHEMA = z.object({
  pack: MARKET_PACK_SCHEMA,
  hash: z.string().regex(/^[0-9a-f]{64}$/, "Expected a SHA-256 hex digest"),
  signature: z.object({
    keyId: z.string().min(1),
    value: z.base64().min(1),
  }),
});
