/**
 * Stackra file contract:
 * Purpose: `attestationKey`: the R2 key of a provenance bundle.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */

/** The R2 key of a provenance bundle. */
export const attestationKey = (name: string, version: string): string =>
  `attestations/${name}/${version}.sigstore.json`;
