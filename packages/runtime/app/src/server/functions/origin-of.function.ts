/**
 * Stackra file contract:
 * Purpose: `originOf`, a URL string (an `Origin` value, a `Referer`, a configured origin) as its normalised
 *          `scheme://host[:port]` origin, case and default port normalised.
 * Boundary: internal, pure. The opaque origin `null` and anything that is not a URL give `undefined`.
 * Runtime: node
 * Governing contract: ADR 0437 (server-check order).
 */

/**
 * `value` as a normalised origin, or `undefined` when it is not one.
 *
 * @example
 * originOf("https://APP.acme.example:443/orders"); // "https://app.acme.example"
 */
export function originOf(value: string): string | undefined {
  try {
    const origin = new URL(value).origin;
    return origin === "null" ? undefined : origin;
  } catch {
    return undefined;
  }
}
