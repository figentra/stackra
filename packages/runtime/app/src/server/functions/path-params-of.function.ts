/**
 * Stackra file contract:
 * Purpose: `pathParamsOf`, the `:name` parameters of a route template read from the request path by segment position.
 * Boundary: pure. A segment of the path with no template counterpart is ignored; a template segment the path lacks is
 *           absent; values are percent-decoded, and an undecodable one is kept as sent.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (STA-2577 note: raw adapters read their own path parameters).
 */

/**
 * The path parameters of `pathname` under `template`.
 *
 * @example
 * pathParamsOf("/orders/:orderId", "/orders/ord_1"); // { orderId: "ord_1" }
 */
export function pathParamsOf(template: string, pathname: string): Record<string, string> {
  const actual = pathname.split("/");
  const params: Record<string, string> = {};
  template.split("/").forEach((segment, index) => {
    const value = actual[index];
    if (!segment.startsWith(":") || value === undefined) return;
    try {
      params[segment.slice(1)] = decodeURIComponent(value);
    } catch {
      params[segment.slice(1)] = value;
    }
  });
  return params;
}
