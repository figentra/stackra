/**
 * Stackra file contract:
 * Purpose: `RegistryLicence`, a Stackra registry licence as every licence API call answers it: the holder, the grants,
 *          the validity window, the status, the tokens, and the token issued by this call (once).
 * Boundary: a type only; the leaf `./contracts` entry. The registry holds no price and no plan; `holderRef` is the
 *           opaque Figentra OS account reference.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decisions 13 and 14); stackra-183 (STA-1335).
 */
import type { RegistryLicenceGrant } from "#contracts/types/registry-licence-grant.type";
import type { RegistryLicenceToken } from "#contracts/types/registry-licence-token.type";

/**
 * A licence as the licence API answers it.
 *
 * @example
 * const { id, issuedToken } = await issuer.apply({ action: "issue", ... }); // issuedToken: "stkl_…", shown once
 */
export interface RegistryLicence {
  /** The registry's licence id. */
  readonly id: string;

  /** The opaque customer account reference in Figentra OS. */
  readonly holderRef: string;

  /** What it may read. */
  readonly grants: readonly RegistryLicenceGrant[];

  /** ISO 8601, or null for "from issue". */
  readonly notBefore: string | null;

  /** ISO 8601, or null for a licence that never expires; reads stop `registry.licence.graceDays` after it. */
  readonly expiresAt: string | null;

  /** `revoked` is final; `suspended` comes back with `resume`. */
  readonly status: "active" | "suspended" | "revoked";

  /** Every token, revoked ones included. */
  readonly tokens: readonly RegistryLicenceToken[];

  /**
   * The `stkl_` token this call issued (issue with a token label, add-token), else null. It is never stored and
   * never answered again, not even to a replay of the same Idempotency-Key.
   */
  readonly issuedToken: string | null;
}
