/**
 * Stackra file contract:
 * Purpose: `CSP_SOURCE_PATTERN`, the grammar every added source must match: one host or scheme source (`https:`,
 *          `cdn.acme.com`, `*.acme.com`, `https://api.acme.com:8443`), with no whitespace, `;` or `,` that would open a
 *          new source list or directive, no quote that would add a keyword (`'unsafe-inline'`), and not a bare `*`.
 * Boundary: the one check behind the configuration's schema and `contentSecurityPolicy`, so additions can widen a
 *           source list but never loosen the baseline. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0251 (desktop hardening).
 */

/** One host or scheme source; refuses separators, quoted keywords and the bare wildcard. */
export const CSP_SOURCE_PATTERN = /^(?!\*$)[^\s;,']+$/;
