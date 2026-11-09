/**
 * Stackra file contract:
 * Purpose: `BUNDLED_PACK_HASHES`, the content hash of every `live` pack this package bundles in `assets/data/packs/`,
 *          to the market whose file holds it: the list a host copies its `packHashes` pins from when it runs the
 *          interim `bundled` source, and the index that driver loads a pinned pack by.
 * Boundary: data only, kept equal to the files by a test (a pack whose content changes changes its hash). A
 *           convenience, never a default: a host still pins each hash in its own config. Drafts are never listed.
 * Runtime: isomorphic
 * Governing contract: ADR 0386 (as amended 2026-11-09); ADR 0385 (decision 7: drafts are for authoring only); ADR 0370
 *                     (decision 2).
 */

/** Content hash (64 hex) to market code; empty while every bundled pack is a draft. */
export const BUNDLED_PACK_HASHES: Readonly<Record<string, string>> = Object.freeze({});
