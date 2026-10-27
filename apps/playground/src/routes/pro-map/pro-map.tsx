/**
 * Stackra file contract:
 * Purpose: the page of the Map route: `@stackra-pro/ui`'s Map as a named map surface with a route, three labelled
 *          stops, a popup for the chosen stop and zoom and compass controls, with a list of buttons beside it that
 *          choose a stop for keyboard and screen-reader users and a line that says which is chosen.
 * Boundary: presentation and local state only. The map draws no tiles and fetches nothing: its style is a plain
 *          background colour (light and dark), so the page needs no network or tile provider, and the stops are
 *          placed by their coordinates over it. MapLibre needs WebGL, which a browser has and jsdom does not, so the
 *          unit test replaces the map and the browser test draws it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { Button } from "@stackra/ui/react";
import * as UiPro from "@stackra-pro/ui/react";
// MapLibre finds its worker next to its own module, which Vite's dep optimiser moves and its build never emits; the
// worker file is self-contained, so Vite serves and emits it as an asset and the map is told its URL.
import MAPLIBRE_WORKER from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { useState } from "react";

import { ProMapRoute } from "#src/routes/pro-map/pro-map.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-map.*` keys.
const STRINGS = {
  documentTitle: `${ProMapRoute.title} · Stackra Playground`,
  intro:
    "A map surface with a route, labelled stops, a popup and controls. The map has no background tiles here; choose a stop from the buttons or from its marker on the map.",
  route: "Dispatch route",
  map: "Dispatch route from the Ferry Building to Chase Center",
  stops: "Stops",
  choose: (name: string) => `Show ${name}`,
  none: "No stop is chosen.",
  chosen: (name: string, status: string, time: string) => `${name}: ${status}, arrival ${time}`,
} as const;

// At zoom 13 the stops sit 245px and 145px apart down the map, so a popup above or below one never reaches the next.
const STOPS = [
  {
    id: "ferry",
    name: "Ferry Building",
    status: "Pickup ready",
    time: "9:12 AM",
    latitude: 37.79519,
    longitude: -122.39385,
    label: "top",
  },
  {
    id: "oracle",
    name: "Oracle Park",
    status: "Next stop",
    time: "9:19 AM",
    latitude: 37.77859,
    longitude: -122.38927,
    label: "top",
  },
  {
    id: "chase",
    name: "Chase Center",
    status: "Dropoff",
    time: "9:27 AM",
    latitude: 37.76892,
    longitude: -122.38779,
    // The route arrives from the north, so a label above this last stop would sit on the line.
    label: "bottom",
  },
] as const;

const ROUTE: [number, number][] = STOPS.map((stop) => [stop.longitude, stop.latitude]);

/** A MapLibre style with one background layer and no sources: no tiles are requested. */
const blank = (color: string) =>
  ({
    version: 8,
    sources: {},
    layers: [{ id: "background", type: "background", paint: { "background-color": color } }],
  }) satisfies UiPro.MapProps["mapStyle"];

const STYLES = { light: blank("#e5e7eb"), dark: blank("#1f2937") };

/** The Map page. */
export function ProMap() {
  const [chosen, setChosen] = useState<(typeof STOPS)[number] | null>(STOPS[1]);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProMapRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="route-heading" className="grid gap-3">
        <h2 id="route-heading" className="type-h2">
          {STRINGS.route}
        </h2>
        <div className="relative h-[480px] w-full overflow-hidden rounded-lg border border-border">
          <UiPro.Map
            label={STRINGS.map}
            styles={STYLES}
            center={[-122.3908, 37.7821]}
            zoom={13}
            workerUrl={MAPLIBRE_WORKER}
          >
            <UiPro.Map.Route coordinates={ROUTE} />
            {STOPS.map((stop) => (
              <UiPro.Map.Marker
                key={stop.id}
                latitude={stop.latitude}
                longitude={stop.longitude}
                onPress={() => setChosen(stop)}
              >
                <UiPro.Map.MarkerContent>
                  <UiPro.Map.MarkerDot />
                  <UiPro.Map.MarkerLabel position={stop.label}>{stop.name}</UiPro.Map.MarkerLabel>
                </UiPro.Map.MarkerContent>
              </UiPro.Map.Marker>
            ))}
            {chosen === null ? null : (
              // No fixed anchor, so MapLibre keeps the popup inside the map at any width; the offset lifts it
              // clear of a label above the dot.
              <UiPro.Map.Popup
                closeButton
                closeOnClick={false}
                focusAfterOpen={false}
                latitude={chosen.latitude}
                longitude={chosen.longitude}
                offset={40}
                onClose={() => setChosen(null)}
              >
                <div className="space-y-1 pe-4 text-xs">
                  <p className="font-medium">{chosen.name}</p>
                  <p>{chosen.status}</p>
                </div>
              </UiPro.Map.Popup>
            )}
            <UiPro.Map.Controls>
              <UiPro.Map.ZoomControl />
              <UiPro.Map.CompassControl />
            </UiPro.Map.Controls>
          </UiPro.Map>
        </div>
      </section>
      <section aria-labelledby="stops-heading" className="grid gap-3">
        <h2 id="stops-heading" className="type-h2">
          {STRINGS.stops}
        </h2>
        <div className="flex flex-wrap gap-2">
          {STOPS.map((stop) => (
            <Button key={stop.id} variant="secondary" onPress={() => setChosen(stop)}>
              {STRINGS.choose(stop.name)}
            </Button>
          ))}
        </div>
        <p role="status">
          <bdi>
            {chosen === null
              ? STRINGS.none
              : STRINGS.chosen(chosen.name, chosen.status, chosen.time)}
          </bdi>
        </p>
      </section>
    </article>
  );
}
