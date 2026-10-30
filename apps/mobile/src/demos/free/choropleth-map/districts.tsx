/**
 * Stackra file contract:
 * Purpose: the "districts" demo of the native ChoroplethMap: a month's orders across the districts of a made-up town.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The map is a handful of invented shapes drawn here, not a real place: the design system ships no map data.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { ChoroplethMap, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHOROPLETH_MAP_DEMO_KEYS } from "#src/demos/free/choropleth-map/choropleth-map-demo-keys.constant";

/** The demo's keys. */
const K = CHOROPLETH_MAP_DEMO_KEYS.demo_free.choropleth_map.districts;

/** An invented town's districts, as outlines of `[longitude, latitude]` points. */
const DISTRICTS = {
  north: [
    [
      [1, 4],
      [3.5, 4.3],
      [5.5, 3.6],
      [4.2, 2.4],
      [2.2, 2.6],
      [1, 4],
    ],
  ],
  east: [
    [
      [5.5, 3.6],
      [6.5, 2],
      [5.8, 0.2],
      [3.4, 1.2],
      [4.2, 2.4],
      [5.5, 3.6],
    ],
  ],
  south: [
    [
      [5.8, 0.2],
      [3.2, -0.2],
      [0.8, 0.4],
      [1.8, 1.4],
      [3.4, 1.2],
      [5.8, 0.2],
    ],
  ],
  west: [
    [
      [0.8, 0.4],
      [0, 2],
      [1, 4],
      [2.2, 2.6],
      [1.8, 1.4],
      [0.8, 0.4],
    ],
  ],
  centre: [
    [
      [2.2, 2.6],
      [4.2, 2.4],
      [3.4, 1.2],
      [1.8, 1.4],
      [2.2, 2.6],
    ],
  ],
  harbour: [
    [
      [6.9, 0.7],
      [7.6, 1.1],
      [7.5, 0.3],
      [6.9, 0.7],
    ],
  ],
} as const;

/** Orders in each district; the harbour has none yet. */
const ORDERS = { north: 820, east: 1460, south: 540, west: 310, centre: 2100 };

/** Choropleth map: districts. */
export default function Districts() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ChoroplethMap
      label={t(K.label)}
      values={ORDERS}
      features={{
        type: "FeatureCollection",
        features: Object.entries(DISTRICTS).map(([id, coordinates]) => ({
          type: "Feature",
          properties: { id, name: t(K[id as keyof typeof DISTRICTS]) },
          geometry: { type: "Polygon", coordinates },
        })),
      }}
    />
  );
}
