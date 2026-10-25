/**
 * Stackra file contract:
 * Purpose: `GeocodeQuery`, what a `Geocoder` is asked: free text, the language of the answer, and the country and
 *          position to prefer.
 * Boundary: a type only. The text is what a person typed; a driver sends it to its provider only.
 * Runtime: isomorphic
 * Governing contract: OS-182; ADR 0305.
 */
import type { CountryCode } from "@stackra/validation";

import type { GeoPoint } from "#contracts/types/geo-point.type";

/** A forward geocoding request. */
export interface GeocodeQuery {
  /** The address or place as typed. */
  readonly text: string;

  /** The BCP 47 language the answer's labels are wanted in. */
  readonly locale: string;

  /** Only answers in these countries. */
  readonly countries?: readonly CountryCode[];

  /** Prefer answers near this point. */
  readonly near?: GeoPoint;
}
