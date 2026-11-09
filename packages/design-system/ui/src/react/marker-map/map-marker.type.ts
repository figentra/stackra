/**
 * Stackra file contract:
 * Purpose: `MapMarker`, one pin of a `MarkerMap`: where it is and what it is called.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); STA-1981.
 */

/** One pin of a MarkerMap. */
export interface MapMarker {
  /** The pin's key, which `selectedId` and `onSelect` use. */
  readonly id: string;
  /** Degrees north of the equator, -90 to 90. */
  readonly latitude: number;
  /** Degrees east of Greenwich, -180 to 180. */
  readonly longitude: number;
  /** The pin's name, shown in the list and spoken. */
  readonly label: string;
  /** A count at the place, for example its open jobs; it sizes the pin and shows in the list. */
  readonly count?: number | undefined;
}
