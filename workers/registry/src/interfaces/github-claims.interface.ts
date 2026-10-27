/**
 * Stackra file contract:
 * Purpose: `GithubClaims`: the GitHub Actions ID token claims the registry reads.
 * Boundary: verification only; minting the publish token is `exchangeToken`'s. Throws `OidcError` with a reason that
 *           names no token value.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 3 and 6).
 */

/** The GitHub Actions ID token claims the registry reads. */
export interface GithubClaims {
  readonly iss: string;
  readonly aud: string | readonly string[];
  readonly exp: number;
  readonly nbf?: number;
  readonly repository: string;
  readonly repository_id: string;
  readonly repository_owner_id: string;
  readonly workflow_ref: string;
  readonly ref: string;
  readonly environment?: string;
  readonly run_id: string;
  readonly run_attempt: string;
}
