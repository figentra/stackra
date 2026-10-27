/**
 * Stackra file contract:
 * Purpose: `isAllowedOrigin`, the one origin comparison `OriginGuard` and `corsHeaders` share: an origin passes when
 *          it equals one of `allowed`, both compared through `originOf`.
 * Boundary: internal, pure. The opaque origin `null` and anything that is not a URL never pass; there is no wildcard.
 * Runtime: node
 * Governing contract: ADR 0437 (server-check order).
 */
import { originOf } from "#server/functions/origin-of.function";

/**
 * Whether `origin` is one of `allowed`.
 *
 * @example
 * isAllowedOrigin("https://APP.acme.example:443", ["https://app.acme.example"]); // true
 */
export function isAllowedOrigin(origin: string, allowed: readonly string[]): boolean {
  const given = originOf(origin);
  return given !== undefined && allowed.some((entry) => originOf(entry) === given);
}
