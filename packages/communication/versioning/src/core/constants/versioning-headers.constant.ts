/**
 * Stackra file contract:
 * Purpose: `VERSIONING_HEADERS`, the header names of dated versioning: the `Stackra-Version` request header and the
 *          `Deprecation` and `Sunset` response headers an older version carries.
 * Boundary: frozen; names only (HTTP compares them case-insensitively). The client side sets `Stackra-Version` through
 *           `@stackra/transport`; this side reads it and writes the other two.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decisions 3 and 4); RFC 9745 (`Deprecation`); RFC 8594 (`Sunset`).
 */

/**
 * The header names of dated versioning.
 *
 * @example
 * const resolved = resolveVersion({ header: request.headers.get(VERSIONING_HEADERS.version), ...rest });
 */
export const VERSIONING_HEADERS = Object.freeze({
  /** The request's dated version (`2027-03-01`); it overrides the caller's pin for one request. */
  version: "Stackra-Version",
  /** `@<unix seconds>`: when the version the response is shaped for was superseded. */
  deprecation: "Deprecation",
  /** The HTTP date after which that version is refused. */
  sunset: "Sunset",
});
