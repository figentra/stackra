/**
 * Stackra file contract:
 * Purpose: `applyVersionHeaders`, the edge step after `resolveVersion`: writes the resolved `Deprecation` and `Sunset`
 *          headers onto the outgoing response headers and adds `Stackra-Version` to `Vary`, so a shared cache never
 *          serves one version's shape to a caller of another.
 * Boundary: mutates only the `Headers` it is given; reads nothing else. An existing `Vary` keeps its values. The
 *           generated gateway's version middleware calls it once per response.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decision 4); ADR 0237 (the version header is handled in the gateway); RFC 9745;
 *                     RFC 8594; RFC 9110 section 12.5.5 (`Vary`).
 */
import { VERSIONING_HEADERS } from "#core/constants/versioning-headers.constant";
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
  const vary = headers.get("Vary");
  const names = vary?.split(",").map((name) => name.trim().toLowerCase()) ?? [];
  if (!names.includes("*") && !names.includes(VERSIONING_HEADERS.version.toLowerCase()))
    headers.set(
      "Vary",
      vary ? `${vary}, ${VERSIONING_HEADERS.version}` : VERSIONING_HEADERS.version,
    );
}
