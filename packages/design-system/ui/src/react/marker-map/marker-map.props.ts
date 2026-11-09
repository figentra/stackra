/**
 * Stackra file contract:
 * Purpose: `MarkerMapProps`, the props of the web `MarkerMap` in `marker-map.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); STA-1981.
 */
import type { MapMarker } from "#react/marker-map/map-marker.type";

/** Props of the web MarkerMap. */
export interface MarkerMapProps {
  /** The pins to draw, in the order the list shows them. */
  readonly markers: readonly MapMarker[];
  /** The selected pin, for a controlled map; pair it with `onSelect`. Null for none. */
  readonly selectedId?: string | null | undefined;
  /** Called with a pin's id when it is chosen on the map or in the list. */
  readonly onSelect?: ((id: string) => void) | undefined;
  /** The map's accessible name, for example "Today's job sites". */
  readonly label: string;
  /** The title and spoken name of the list of pins beside the map, for example "Sites". Defaults to `label`. */
  readonly listLabel?: string | undefined;
  /** The map's height in pixels. Defaults to 360. */
  readonly height?: number | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
}
