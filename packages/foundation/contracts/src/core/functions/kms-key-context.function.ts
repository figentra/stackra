/**
 * Stackra file contract:
 * Purpose: `kmsKeyContext`, the KMS encryption context a tenant data key is wrapped and unwrapped with: the tenant id
 *          and the key id, so a wrapped key copied to another tenant's row, or renamed, fails to unwrap.
 * Boundary: internal to the package; pure. Wrapping and unwrapping share it, so the two never drift. KMS logs the
 *           context in CloudTrail, so it holds ids only.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0415 (decision 2).
 */

/**
 * The encryption context of data key `keyId` of `tenantId`.
 *
 * @example
 * kmsKeyContext("ten_01j9", "k1"); // { "stackra:tenant": "ten_01j9", "stackra:key": "k1" }
 */
export function kmsKeyContext(tenantId: string, keyId: string): Record<string, string> {
  return { "stackra:tenant": tenantId, "stackra:key": keyId };
}
