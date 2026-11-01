/**
 * Stackra file contract:
 * Purpose: `MAP_SOURCE`, the committed archify candidate of the architecture map, repository-relative: YAML, the repo's
 *          config format; archify gets a JSON copy.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0452; STA-1373.
 */

/** The committed candidate the drift check compares. */
export const MAP_SOURCE = "apps/docs/scripts/architecture-map/architecture-map.yaml";
