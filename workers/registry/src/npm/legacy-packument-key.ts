/**
 * Stackra file contract:
 * Purpose: `legacyPackumentKey`: the host-less KV key of a packument, as the version before the registry answered on
 *          two hosts wrote it (STA-2892). Only ever deleted, so a rollback to that version never reads a stale body.
 * Boundary: rendering and the KV cache only; read rules are the caller's.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 3, 4, 8 and 9).
 */

/**
 * The host-less KV key of a package's packument (full or abbreviated).
 *
 * @example
 * legacyPackumentKey("@stackra/core", false); // "packument:full:@stackra/core"
 */
export const legacyPackumentKey = (name: string, abbreviated: boolean): string =>
  `packument:${abbreviated ? "abbreviated" : "full"}:${name}`;
