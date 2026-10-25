/**
 * Stackra file contract:
 * Purpose: `KeyUser`, an account (and optionally only some of its roles) that a KMS key or a bucket lets in from
 *          outside the key's own account.
 * Boundary: internal; roles are matched by an `aws:PrincipalArn` condition on the account root, so a role that does
 *           not exist yet never makes the policy invalid.
 * Runtime: node
 * Governing contract: ADR 0172 (account boundaries), ADR 0186 (the backup account).
 */

/** A cross-account user of a key or bucket. */
export type KeyUser = {
  /** The 12-digit account id. */
  readonly account: string;
  /** The role ARNs allowed; every principal of the account when omitted. */
  readonly roles?: readonly string[];
};
