/**
 * Stackra file contract:
 * Purpose: `packumentKey`: the KV keys of a package's two packuments.
 * Boundary: rendering and the KV cache only; read rules are the caller's.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 3, 4, 8 and 9).
 */

/** The KV keys of a package's two packuments. */
export const packumentKey = (name: string, abbreviated: boolean): string =>
  `packument:${abbreviated ? "abbreviated" : "full"}:${name}`;
