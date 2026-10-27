/**
 * Stackra file contract:
 * Purpose: `matchPublisher`: the trusted publisher the claims match, or null.
 * Boundary: verification only; minting the publish token is `exchangeToken`'s. Throws `OidcError` with a reason that
 *           names no token value.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 3 and 6).
 */
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import type { PublisherRow } from "#src/interfaces/publisher-row.interface";

/**
 * The trusted publisher the claims match, or null.
 *
 * @example
 * matchPublisher(claims, await store.publishers("@stackra")); // the figentra/stackra row
 */
export function matchPublisher(
  claims: GithubClaims,
  publishers: readonly PublisherRow[],
): PublisherRow | null {
  return (
    publishers.find(
      (row) =>
        claims.repository === row.repository &&
        String(claims.repository_id) === row.repository_id &&
        String(claims.repository_owner_id) === row.repository_owner_id &&
        claims.workflow_ref === `${row.repository}/${row.workflow}@${row.ref}` &&
        claims.ref === row.ref &&
        claims.environment === row.environment,
    ) ?? null
  );
}
