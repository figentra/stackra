/**
 * Stackra file contract:
 * Purpose: `RegistryLicenceToken`, one token of a Stackra registry licence as the licence API describes it: its id,
 *          label and times, never the token itself.
 * Boundary: a type only; the leaf `./contracts` entry. The token value appears once, in `RegistryLicence.issuedToken`.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decisions 13 and 14); stackra-183 (STA-1335).
 */

/** One token of a licence (one per CI system or machine). */
export interface RegistryLicenceToken {
  /** The token's id, used to revoke it (`DELETE /-/stackra/v1/licences/:id/tokens/:tokenId`). */
  readonly id: string;

  /** Where it is used ("github-actions", "build-mac-2"). */
  readonly label: string;

  /** When the token was issued, ISO 8601. */
  readonly createdAt: string;

  /** ISO 8601 once revoked, else null. */
  readonly revokedAt: string | null;
}
