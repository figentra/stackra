/**
 * Stackra file contract:
 * Purpose: `distOf`: the npm `dist` of a version.
 * Boundary: rendering and the KV cache only; read rules are the caller's.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 3, 4, 8 and 9).
 */
import { splitName } from "#src/http/split-name";
import type { VersionRow } from "#src/interfaces/version-row.interface";

/** The npm `dist` of a version. */
export function distOf(row: VersionRow, host: string): Record<string, unknown> {
  const { bare } = splitName(row.name);
  return {
    integrity: row.integrity,
    shasum: row.shasum,
    tarball: `https://${host}/${row.name}/-/${bare}-${row.version}.tgz`,
    signatures: JSON.parse(row.signatures) as unknown,
    attestations: {
      url: `https://${host}/-/npm/v1/attestations/${row.name}@${row.version}`,
      provenance: { predicateType: row.predicate_type },
    },
  };
}
