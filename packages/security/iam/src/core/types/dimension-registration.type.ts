/**
 * Stackra file contract:
 * Purpose: `DimensionRegistration`, one row gen hands `registerDimensions`: a model's field that carries the id of a
 *          dimension another service owns (`record.channel_id` of `orders.order` is a `sales.channel`).
 * Boundary: a type only. Gen derives it from the field typed `DimensionId<"…">` (ADR 0351 decision 2) and the
 *           manifest's dimension list, so the decision point knows which condition fields need the projection.
 * Runtime: isomorphic
 * Governing contract: ADR 0351 (decisions 1 to 3).
 */

/** One dimension-typed field. */
export interface DimensionRegistration {
  /** The model's key (`orders.order`). */
  readonly model: string;

  /** The field's path under the `record` fact source (`record.channel_id`). */
  readonly field: string;

  /** The dimension's key as the manifest registers it (`sales.channel`). */
  readonly dimension: string;
}
