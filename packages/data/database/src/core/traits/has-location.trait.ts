/**
 * Stackra file contract:
 * Purpose: `HasLocation`, the trait of a model whose records sit at one point on the earth: a store, a depot, a
 *          customer's door, a vehicle's last fix.
 * Boundary: adds the field only (`location`, the blueprint's `t.point("location")`: `geography(Point,4326)` with its
 *           GiST index). Searching near it is `withinMetresOf(…)`. A customer's door is personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0314 (decision 2, as amended 2026-11-07: `HasLocation`, owned by @stackra/database); ADR
 *                     0096 (trait names); ADR 0294 (decision 27); STA-1432.
 */
import type { GeoPoint } from "@stackra/contracts";
import { createTrait } from "@stackra/model";
import type { Trait } from "@stackra/model";

/**
 * The location trait.
 *
 * @example
 * export class Store extends Model.with(HasPublicId("sto"), HasLocation) {}
 * await stores.find({ $raw: withinMetresOf(Stores.columns.location, customer, 5_000) });
 */
export const HasLocation: Trait<{ location: GeoPoint }> = createTrait(
  "has_location",
  (base) =>
    class extends base {
      /** Where the record is, WGS 84. */
      location!: GeoPoint;
    },
);
