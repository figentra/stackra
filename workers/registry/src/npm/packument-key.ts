/**
 * Stackra file contract:
 * Purpose: `packumentKey`: the KV key of a package's packument as rendered for one host (full or abbreviated); each
 *          host has its own, since the body names tarballs on that host (STA-2892).
 * Boundary: rendering and the KV cache only; read rules are the caller's.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3, 4, 8 and 9).
 */

/**
 * The KV key of a package's packument rendered for `host`: its tarball URLs name that host, so each host has its own.
 *
 * @example
 * packumentKey("@stackra/core", false, "npm.figentra.com"); // "packument:full:npm.figentra.com:@stackra/core"
 */
export const packumentKey = (name: string, abbreviated: boolean, host: string): string =>
  `packument:${abbreviated ? "abbreviated" : "full"}:${host}:${name}`;
