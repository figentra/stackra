/**
 * Stackra file contract:
 * Purpose: `GeocodeResult`, one place a `Geocoder` or `AddressAutocomplete` answers with: the structured address, the
 *          point, a one-line label and the provider's id of the place.
 * Boundary: a type only. The address is `@stackra/validation`'s `Address`, so it is checked with the Market's
 *           `address(format)` before it is stored; the provider's id is never shown.
 * Runtime: isomorphic
 * Governing contract: OS-182; OS-370; ADR 0305.
 */
import type { GeoPoint } from "@stackra/contracts";
import type { Address } from "@stackra/validation";

/** A geocoded place. */
export interface GeocodeResult {
  /** The structured address, as complete as the provider knows it. */
  readonly address: Address;

  /** Where it is. */
  readonly point: GeoPoint;

  /** One line for a list or a pin, in the query's language. */
  readonly label: string;

  /** The provider's id of the place. */
  readonly placeId: string;

  /** How exact the point is: a rooftop, an interpolated street number, a street, or an area. */
  readonly precision: "rooftop" | "interpolated" | "street" | "area";
}
