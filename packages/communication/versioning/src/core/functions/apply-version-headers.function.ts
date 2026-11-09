/**
 * Stackra file contract:
 * Purpose: `applyVersionHeaders`, the edge step after `resolveVersion`: writes the resolved `Deprecation` and `Sunset`
 *          headers onto the outgoing response headers, names the version in `Stackra-Version` (every answer does) and
 *          adds `Stackra-Version` to `Vary`, so a shared cache never serves one version's shape to a caller of another.
 * Boundary: mutates only the `Headers` it is given; reads nothing else. An existing `Vary` keeps its values. The
 *           generated adapter reaches it through `serveVersioned`.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decision 4); ADR 0237 (the version header is handled in the gateway); RFC 9745;
 *                     RFC 8594; RFC 9110 section 12.5.5 (`Vary`); STA-2532 (FR-006).
 */
import { VERSIONING_HEADERS } from "#core/constants/versioning-headers.constant";
import { varyOnVersion } from "#core/functions/vary-on-version.function";
import type { ResolvedVersion } from "#core/types/resolved-version.type";

/**
 * Writes a resolved version's headers onto a response's headers.
 *
 * @example
 * const resolved = resolveVersion({ header: request.headers.get(VERSIONING_HEADERS.version), ...versioning, now });
 * const response = Response.json(downgrade(OrderView, view, resolved.version));
 * applyVersionHeaders(response.headers, resolved);
 */
export function applyVersionHeaders(headers: Headers, resolved: ResolvedVersion): void {
  for (const [name, value] of Object.entries(resolved.headers)) headers.set(name, value);
  headers.set(VERSIONING_HEADERS.version, resolved.version);
  varyOnVersion(headers);
}
