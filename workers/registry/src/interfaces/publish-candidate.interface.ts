/**
 * Stackra file contract:
 * Purpose: `PublishCandidate`: what one publish offers.
 * Boundary: pure; the size limit, the immutability check and the provenance check are the publish handler's.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 7, 8 and 11); ADR 0316 (decision 2); ADR 0024 (decision 5); ADR 0013.
 */
import type { ScopeRow } from "#src/interfaces/scope-row.interface";
import type { TarballContents } from "#src/interfaces/tarball-contents.interface";
import type { TarballDigests } from "#src/interfaces/tarball-digests.interface";

/** What one publish offers. */
export interface PublishCandidate {
  /** The package name of the request URL. */
  readonly name: string;
  /** The single version key of the publish body. */
  readonly version: string;
  readonly scope: ScopeRow;
  readonly contents: TarballContents;
  readonly digests: TarballDigests;
  /** `versions[version].dist` of the publish body. */
  readonly clientDist: { readonly integrity?: unknown; readonly shasum?: unknown };
}
