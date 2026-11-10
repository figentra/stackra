/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web MarkerMap: active subscriptions in five Saudi cities, each pin sized by its
 *          count, chosen on the map or in the list beside it, with the choice read back below.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The coordinates are the cities' own (data); their names come from the demo's catalogues.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1981.
 */
import { MarkerMap, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MARKER_MAP_KEYS } from "#src/demos/free/marker-map/marker-map-keys.constant";

/** The demo's keys. */
const K = MARKER_MAP_KEYS.marker_map;

/** Five cities with their active subscriptions. */
const CITIES = [
  { id: "riyadh", latitude: 24.7136, longitude: 46.6753, count: 42, name: K.riyadh },
  { id: "jeddah", latitude: 21.4858, longitude: 39.1925, count: 31, name: K.jeddah },
  { id: "dammam", latitude: 26.4207, longitude: 50.0888, count: 18, name: K.dammam },
  { id: "madinah", latitude: 24.5247, longitude: 39.5692, count: 9, name: K.madinah },
  { id: "abha", latitude: 18.2164, longitude: 42.5053, count: 5, name: K.abha },
] as const;

/** The MarkerMap demo: basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [selectedId, setSelectedId] = useState<string>("riyadh");
  const markers = CITIES.map(({ name, ...city }) => ({ ...city, label: t(name) }));
  const selected = markers.find((marker) => marker.id === selectedId);
  return (
    <div className="grid w-full gap-3">
      <MarkerMap
        label={t(K.label)}
        listLabel={t(K.list_label)}
        markers={markers}
        selectedId={selectedId}
        onSelect={setSelectedId}
        height={320}
      />
      <Text type="small" tone="muted">
        {t(K.selected, { city: selected?.label ?? "" })}
      </Text>
    </div>
  );
}
