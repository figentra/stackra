/**
 * Stackra file contract:
 * Purpose: `renderManifest`: one version's manifest as npm serves it.
 * Boundary: rendering and the KV cache only; read rules are the caller's.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 3, 4, 8 and 9).
 */
import type { VersionRow } from "#src/interfaces/version-row.interface";
import { distOf } from "#src/npm/dist-of";

/**
 * One version's manifest as npm serves it.
 *
 * @example
 * renderManifest(row, "npm.stackra.figentra.com").dist; // { integrity, shasum, tarball, signatures, attestations }
 */
export function renderManifest(row: VersionRow, host: string): Record<string, unknown> {
  const manifest = JSON.parse(row.manifest) as Record<string, unknown>;
  return {
    ...manifest,
    _id: `${row.name}@${row.version}`,
    ...(row.deprecated === null ? {} : { deprecated: row.deprecated }),
    dist: distOf(row, host),
  };
}
