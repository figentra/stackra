/**
 * Stackra file contract:
 * Purpose: `SigningKeySlot`, one active edge-signing key: its id, the secret name the Worker and the API read its value
 *          from, and whether the Worker signs with it.
 * Boundary: type only; `signingKeySlots` builds the list. Names only: the value is placed by the owner.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 4: two active keys), ADR 0173 (secret names in git, values never).
 */

/** One active signing key. */
export type SigningKeySlot = {
  /** `k2026-10`, as the `x-figentra-key` header names it. */
  readonly keyId: string;
  /** The Worker secret holding the key, such as `STACKRA_EDGE_SIGNING_KEY_K2026_10`. */
  readonly secret: string;
  /** True for the newest key only: the Worker signs with it, the API accepts every slot. */
  readonly signs: boolean;
};
