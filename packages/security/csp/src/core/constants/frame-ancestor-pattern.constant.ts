/**
 * Stackra file contract:
 * Purpose: `FRAME_ANCESTOR_PATTERN`, the grammar of one `frame-ancestors` source a host allows: `self`, or one http(s)
 *          origin with no wildcard, path, query, fragment or userinfo.
 * Boundary: the schema's check at boot; `frameAncestorOrigin` checks it again per response, with the origin itself.
 *           No `*` anywhere: a page that can take a payment is never framed by any site (STA-2562), so a wildcard has
 *           no exception here. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0334 rule 12.
 */

/** `self` or one http(s) origin; refuses wildcards, separators, quotes and anything after the authority. */
export const FRAME_ANCESTOR_PATTERN = /^(?:self|https?:\/\/[^\s;,'*/?#@]+)$/;
