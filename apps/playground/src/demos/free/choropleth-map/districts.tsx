/**
 * Stackra file contract:
 * Purpose: the "districts" demo of the web ChoroplethMap: a month's orders across Saudi Arabia's 13 regions, named in
 *          English and Arabic through the demo's catalogues.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The outlines are the demo's own hand-simplified `SAUDI_REGIONS`: the design system ships no map data.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { ChoroplethMap, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHOROPLETH_MAP_KEYS } from "#src/demos/free/choropleth-map/choropleth-map-keys.constant";
import { SAUDI_REGIONS } from "#src/demos/free/choropleth-map/saudi-regions.constant";

/** The demo's keys. */
const K = CHOROPLETH_MAP_KEYS.choropleth_map;

/** Orders in each region; the Northern Borders have none yet. */
const ORDERS = {
  riyadh: 4200,
  makkah: 3600,
  eastern: 2900,
  madinah: 1500,
  asir: 1100,
  qassim: 900,
  jazan: 700,
  tabuk: 600,
  hail: 480,
  najran: 350,
  jawf: 300,
  bahah: 260,
};

/** Choropleth map: orders by region. */
export default function Districts() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ChoroplethMap
      className="w-full"
      label={t(K.label)}
      values={ORDERS}
      features={{
        type: "FeatureCollection",
        features: Object.entries(SAUDI_REGIONS).map(([id, coordinates]) => ({
          type: "Feature",
          properties: { id, name: t(K[id as keyof typeof SAUDI_REGIONS]) },
          geometry: { type: "Polygon", coordinates },
        })),
      }}
    />
  );
}
