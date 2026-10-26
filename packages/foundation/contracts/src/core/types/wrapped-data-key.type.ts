/**
 * Stackra file contract:
 * Purpose: `WrappedDataKey`, one tenant data key as it is stored: its id and the bytes AWS KMS returned when it
 *          generated the key, wrapped under the environment's KMS key and bound to the tenant and the id.
 * Boundary: a type only. The wrapped form is safe to store beside the tenant's row (it opens only through KMS, for
 *           that tenant and id); the plaintext key never leaves process memory. Deleting every wrapped key of a
 *           tenant crypto-shreds its data.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0415.
 */

/** A data key wrapped by KMS. */
export type WrappedDataKey = {
  /** The key's id, written into every sealed form it seals. */
  readonly id: string;
  /** The KMS ciphertext blob, base64url. */
  readonly wrapped: string;
};
