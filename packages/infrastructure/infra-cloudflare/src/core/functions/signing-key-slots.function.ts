/**
 * Stackra file contract:
 * Purpose: `signingKeySlots(keyIds)`, the active edge-signing keys as secret slots: the newest signs, every one
 *          verifies, so the secret rotates with no cut-over (add a key in front, then drop the oldest).
 * Boundary: pure; names only. The owner places each value in Infisical, which syncs it to the Worker and the API
 *           (ADR 0173); the signature itself is the Worker's and the API pipeline's code (OS), not this package's.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 4), ADR 0173, ADR 0231 (secret names in SCREAMING_SNAKE).
 */
import type { SigningKeySlot } from "#core/types/signing-key-slot.type";

/**
 * The slots of `keyIds`, newest first as the stack config lists them.
 *
 * @example
 * signingKeySlots(["k2026-10", "k2026-07"]);
 * // [{ keyId: "k2026-10", secret: "STACKRA_EDGE_SIGNING_KEY_K2026_10", signs: true },
 * //  { keyId: "k2026-07", secret: "STACKRA_EDGE_SIGNING_KEY_K2026_07", signs: false }]
 */
export function signingKeySlots(keyIds: readonly string[]): SigningKeySlot[] {
  return keyIds.map((keyId, index) => ({
    keyId,
    secret: `STACKRA_EDGE_SIGNING_KEY_${keyId.toUpperCase().replaceAll("-", "_")}`,
    signs: index === 0,
  }));
}
