/**
 * Stackra file contract:
 * Purpose: `GithubClaims`: the GitHub Actions ID token claims the registry reads.
 * Boundary: verification only; minting the publish token is `exchangeToken`'s. Throws `OidcError` with a reason that
 *           names no token value.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3 and 6).
 */

/** The GitHub Actions ID token claims the registry reads. */
export interface GithubClaims {
  /** The token issuer, which must be the configured OIDC issuer. */
  readonly iss: string;
  /** The token audience, which must include `npm:<host>`. */
  readonly aud: string | readonly string[];
  /** When the token expires, in seconds since the epoch. */
  readonly exp: number;
  /** The time before which the token is not valid, in seconds since the epoch. */
  readonly nbf?: number;
  /** The `owner/repo` name of the repository the workflow ran in. */
  readonly repository: string;
  /** The numeric id of that repository, which survives a rename. */
  readonly repository_id: string;
  /** The numeric id of the repository owner, which survives a rename. */
  readonly repository_owner_id: string;
  /** The workflow file and ref that ran, `owner/repo/.github/workflows/<file>@<ref>`. */
  readonly workflow_ref: string;
  /** The git ref the workflow ran on. */
  readonly ref: string;
  /** The GitHub deployment environment of the job, when it has one. */
  readonly environment?: string;
  /** The id of the workflow run. */
  readonly run_id: string;
  /** The attempt number of the workflow run. */
  readonly run_attempt: string;
}
