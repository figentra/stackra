/**
 * Stackra file contract:
 * Purpose: `varyOnVersion`, which adds `Stackra-Version` to a response's `Vary`, so a shared cache never serves one
 *          version's shape to a caller of another.
 * Boundary: mutates only the `Headers` it is given; an existing `Vary` keeps its values, and `Vary: *` is left alone.
 *           Internal: `applyVersionHeaders` and `serveVersioned` call it.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decision 4); RFC 9110 section 12.5.5 (`Vary`).
 */
import { VERSIONING_HEADERS } from "#core/constants/versioning-headers.constant";

/** Adds `Stackra-Version` to `headers`' `Vary` once. */
export function varyOnVersion(headers: Headers): void {
  const vary = headers.get("Vary");
  const names = vary?.split(",").map((name) => name.trim().toLowerCase()) ?? [];
  if (!names.includes("*") && !names.includes(VERSIONING_HEADERS.version.toLowerCase()))
    headers.set(
      "Vary",
      vary ? `${vary}, ${VERSIONING_HEADERS.version}` : VERSIONING_HEADERS.version,
    );
}
