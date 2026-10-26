/**
 * Stackra file contract:
 * Purpose: `OSM_EXTRACTS`, the default OpenStreetMap extracts a region's geocoder imports (owner decision R2-9): GCC,
 *          Egypt, Europe and the United States, each with its Geofabrik download URL and its daily replication URL.
 * Boundary: data; the root runway's `providers.tools.sources.<key>` replaces or adds an extract, and
 *           `providers.tools.extracts.<region>` picks one per region.
 * Runtime: isomorphic
 * Governing contract: owner decision R2-9 (2026-10-26); ADR 0444.
 */

/** Extract key to its download and replication URLs. */
export const OSM_EXTRACTS: Readonly<
  Record<string, { readonly url: string; readonly updates?: string }>
> = {
  gcc: {
    url: "https://download.geofabrik.de/asia/gcc-states-latest.osm.pbf",
    updates: "https://download.geofabrik.de/asia/gcc-states-updates/",
  },
  egypt: {
    url: "https://download.geofabrik.de/africa/egypt-latest.osm.pbf",
    updates: "https://download.geofabrik.de/africa/egypt-updates/",
  },
  eu: {
    url: "https://download.geofabrik.de/europe-latest.osm.pbf",
    updates: "https://download.geofabrik.de/europe-updates/",
  },
  us: {
    url: "https://download.geofabrik.de/north-america/us-latest.osm.pbf",
    updates: "https://download.geofabrik.de/north-america/us-updates/",
  },
};
