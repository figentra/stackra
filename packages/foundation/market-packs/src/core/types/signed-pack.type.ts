/**
 * Stackra file contract:
 * Purpose: `SignedPack`, a market pack as it ships: its content, the SHA-256 hash of its canonical JSON and the
 *          Ed25519 signature of that hash.
 * Boundary: a type only, the output of `SignedPack$`; `signPack` writes one and `verifyPack` reads one.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 2).
 */
import type { z } from "zod";

import type { SIGNED_PACK_SCHEMA } from "#core/constants/signed-pack-schema.constant";

/** A pack with its hash and signature. */
export type SignedPack = z.output<typeof SIGNED_PACK_SCHEMA>;
