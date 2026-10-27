/**
 * Stackra file contract:
 * Purpose: `bearer`: the bearer token of an Authorization header, or null.
 * Boundary: decides; reads the licence only through the `LicenceCheck` port.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 10 and 13).
 */

/**
 * The bearer token of an Authorization header, or null.
 *
 * @example
 * bearer("Bearer stkl_abc"); // "stkl_abc"
 */
export function bearer(header: string | null): string | null {
  const match = header === null ? null : /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}
