/**
 * Stackra file contract:
 * Purpose: the `DimensionValues` port: the consuming service's event-fed projection of the dimensions other services
 *          own (a channel, a location, a market, a legal entity): whether a value is live, and every live value.
 * Boundary: an abstract class that is its own token, read in process and synchronously by the decision point, which
 *           never calls the owning service (ADR 0351 decision 3). A value not yet projected or retired is not live, so
 *           a condition naming it denies (decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0351 (decisions 1 to 4); ADR 0263.
 */
import { Port } from "@stackra/contracts";

/**
 * The projected values of foreign dimensions.
 *
 * @example
 * export class ProjectionDimensionValuesDriver extends Driver(DimensionValues) {
 *   isLive(dimension: string, id: string) { return this.rows.get(dimension)?.has(id) ?? false; }
 *   live(dimension: string) { return [...(this.rows.get(dimension) ?? [])]; }
 * }
 */
export abstract class DimensionValues extends Port {
  /** Whether `id` is a live value of `dimension`. */
  abstract isLive(dimension: string, id: string): boolean;

  /** Every live value of `dimension`. */
  abstract live(dimension: string): readonly string[];
}
