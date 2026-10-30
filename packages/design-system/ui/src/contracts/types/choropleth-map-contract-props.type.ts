/**
 * Stackra file contract:
 * Purpose: `ChoroplethMapContractProps`, the props of every runtime's `ChoroplethMap`: the caller's GeoJSON regions,
 *          the value of each, which property names and identifies a region, the name, the number format, the colour
 *          and the height.
 * Boundary: types only. No map data ships with the design system: the caller passes the regions it is allowed to use.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); RFC 7946; STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";
import type { GeoFeatureCollection } from "#contracts/types/geo-feature-collection.type";

/** Props shared by the web and native `ChoroplethMap`. */
export interface ChoroplethMapContractProps {
  /** The regions, a GeoJSON FeatureCollection of polygons in longitude and latitude. */
  readonly features: GeoFeatureCollection;
  /** Each region's value, by its `idKey` property; a region with none is drawn empty. */
  readonly values: Readonly<Record<string, number>>;
  /** The property that identifies a region in `values`; `id` by default. */
  readonly idKey?: string | undefined;
  /** The property that names a region; `name` by default. */
  readonly nameKey?: string | undefined;
  /** The map's accessible name and the data table's caption, such as "Orders by region, October". */
  readonly label: string;
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** The colour the five shades are made from; the first accent step by default. */
  readonly color?: ChartColor | undefined;
  /** The map's height in pixels; 280 by default. */
  readonly height?: number | undefined;
}
