/**
 * Stackra file contract:
 * Purpose: `withHeader`, the one way a header middleware adds a header: a copy of the request with the header set,
 *          or the request itself when the header is already there.
 * Boundary: internal. Never mutates the caller's request; the copy takes over its body, as the platform does.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (clients call through the transport).
 */

/**
 * `request` with `name: value`, unless it already has `name`.
 *
 * @example
 * return next(withHeader(request, TRANSPORT_HEADERS.stackraVersion, "2027-03-01"));
 */
export function withHeader(request: Request, name: string, value: string): Request {
  if (request.headers.has(name)) return request;
  const headers = new Headers(request.headers);
  headers.set(name, value);
  return new Request(request, { headers });
}
