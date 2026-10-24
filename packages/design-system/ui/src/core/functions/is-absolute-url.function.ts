/**
 * Stackra file contract:
 * Purpose: whether an `href` starts with a scheme (`https:`, `mailto:`, `tel:`, the app's own), so every native
 *          component that follows a link tells an app path from an address for the system the same way.
 * Boundary: pure; it tests the scheme only and neither parses nor trusts the rest of the string.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 5, router-free links); ADR 0314 (decision 1, the page actions row).
 */

/** A scheme: a letter, then letters, digits, `+`, `.` or `-`, then a colon. */
const SCHEME = /^[a-z][a-z\d+.-]*:/i;

/**
 * True when the `href` is an absolute URL rather than a path inside the app.
 * @param href - the address a link points to
 * @returns whether it starts with a scheme
 */
export function isAbsoluteUrl(href: string): boolean {
  return SCHEME.test(href);
}
