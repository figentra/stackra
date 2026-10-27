/**
 * Stackra file contract:
 * Purpose: the `Geocoder` port: an address or place as text to structured places with points, and a point back to the
 *          nearest address.
 * Boundary: an abstract class that is its own token, key `i18n.Geocoder`. Drivers are provider Integrations chosen per
 *           tenant and Market through the Connection (ADR 0356; OS-182 puts the provider in the market pack); this
 *           package names no provider and holds no SDK (ADR 0147, 0236 for the same rule on translators). A leaf file.
 * Runtime: isomorphic
 * Governing contract: OS-182 (geocoding providers per market); ADR 0356; ADR 0294 (decision 16).
 */
import { type GeoPoint, Port } from "@stackra/contracts";

import type { GeocodeQuery } from "#contracts/types/geocode-query.type";
import type { GeocodeResult } from "#contracts/types/geocode-result.type";

/**
 * Turns text into places and points into addresses.
 *
 * @example
 * export class GoogleGeocoderDriver extends Driver(Geocoder) { … }
 * const [best] = await geocoder.geocode({ text, locale: "ar", countries: ["SA"] });
 */
export abstract class Geocoder extends Port {
  /** Type-only port key. */
  declare readonly "~key": "i18n.Geocoder";

  /**
   * The places that match `query`, best first.
   *
   * @returns an empty list when nothing matches.
   */
  abstract geocode(query: GeocodeQuery): Promise<readonly GeocodeResult[]>;

  /**
   * The address at or nearest to `point`, in `locale`.
   *
   * @returns null when the provider knows no address there.
   */
  abstract reverse(point: GeoPoint, locale: string): Promise<GeocodeResult | null>;
}
