/**
 * Stackra file contract:
 * Purpose: `canonicalRedirect`, the permanent redirect to a page's canonical URL: `301` with `Location` set when the
 *          request's origin or path differs from the canonical one, `null` when the request is already canonical.
 *          The route context's `redirectToCanonical` throws what this returns.
 * Boundary: depends on the two URLs alone, never on the visitor (no cookie, header or IP), as ADR 0297 requires. The
 *           request's query string is kept when the canonical URL names none, so campaign parameters survive. A
 *           relative canonical resolves against the request URL.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 5); ADR 0297 (decision 4).
 */

/**
 * The 301 to `canonical`, or `null` when `request` is already there.
 *
 * @example
 * const redirect = canonicalRedirect(request.url, href(Routes.product, { slug: product.slug }));
 * if (redirect) throw redirect;
 * @throws TypeError when either URL cannot be parsed.
 */
export function canonicalRedirect(request: string | URL, canonical: string | URL): Response | null {
  const current = new URL(request);
  const target = new URL(canonical, current);
  if (target.search === "") target.search = current.search;
  target.hash = "";
  if (target.origin === current.origin && target.pathname === current.pathname) return null;
  return new Response(null, { status: 301, headers: { Location: target.href } });
}
