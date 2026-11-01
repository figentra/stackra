/**
 * Stackra file contract:
 * Purpose: `PERMISSION_LEVEL`, how gen reads a `Permission` static's source: `Permission.L2`, `Permission.L2.system()`
 *          or `Permission.L3.restricted()`, capturing the risk level and the marker.
 * Boundary: data only; matched against the source with whitespace removed. The manifest and the registrations read it,
 *           so every static the manifest locks is also registered at boot.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); ADR 0208 (system and restricted permissions); STA-1702.
 */

/** A `Permission` static's source: group 1 is the level, group 2 the `.system()` or `.restricted()` marker. */
export const PERMISSION_LEVEL = /^Permission\.(L[0-4])(\.system\(\)|\.restricted\(\))?$/;
