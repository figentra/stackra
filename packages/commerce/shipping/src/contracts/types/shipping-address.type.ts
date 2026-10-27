/**
 * Stackra file contract:
 * Purpose: `ShippingAddress`, a postal address as a carrier needs it: the one `Address` of `@stackra/validation`
 *          (lines, district, locality, region, postal code, short address, country) plus coordinates where the market
 *          addresses by location.
 * Boundary: a type in the leaf entry. Personal data: it locates a person. Address formats and validation per country
 *           are market-pack data (`address(format)` of validation) applied before a request is built; this type only
 *           carries the result. A checkout address passes here as it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2); ADR 0363 (decision 3: address format is pack data); STA-1383 (one home
 *                     for duplicated value types).
 */
import type { GeoPoint } from "@stackra/contracts";
import type { Address } from "@stackra/validation";

/**
 * A delivery or collection address.
 *
 * @example
 * const address: ShippingAddress = { lines: ["Building 7, Street 12"], locality: "Springfield", country: "XX" };
 */
export interface ShippingAddress extends Address {
  /** Latitude and longitude in decimal degrees, where the address is a pin. */
  readonly coordinates?: GeoPoint;
}
