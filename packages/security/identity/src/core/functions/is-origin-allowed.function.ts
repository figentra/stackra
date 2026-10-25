/**
 * Stackra file contract:
 * Purpose: `isOriginAllowed`, whether a request's `Origin` is one a publishable key is bound to: an exact origin
 *          (`https://shop.acme.example`) or a one-label wildcard (`https://*.acme.example`, never the bare domain).
 * Boundary: pure; the origins are data on the key's record. A missing or malformed origin is never allowed, and the
 *           scheme and port must match.
 * Runtime: isomorphic
 * Governing contract: COM-56 (an origin-bound Storefront key); ADR 0278 (decision 7).
 */

/** The origin of `text`, or `undefined`. */
function originOf(text: string): URL | undefined {
  try {
    const url = new URL(text);
    return url.origin === "null" ? undefined : url;
  } catch {
    return undefined;
  }
}

/**
 * Whether `origin` matches one of `allowed`.
 *
 * @example
 * isOriginAllowed("https://shop.acme.example", ["https://*.acme.example"]); // true
 */
export function isOriginAllowed(
  origin: string | null | undefined,
  allowed: readonly string[],
): boolean {
  const request = origin === null || origin === undefined ? undefined : originOf(origin);
  if (request === undefined) return false;
  return allowed.some((entry) => {
    const wildcard = entry.includes("://*.");
    const bound = originOf(wildcard ? entry.replace("://*.", "://wildcard.") : entry);
    if (bound === undefined || bound.protocol !== request.protocol || bound.port !== request.port)
      return false;
    if (!wildcard) return bound.hostname === request.hostname;
    const parent = bound.hostname.slice("wildcard.".length);
    const label = request.hostname.slice(0, -(parent.length + 1));
    return request.hostname.endsWith(`.${parent}`) && label !== "" && !label.includes(".");
  });
}
