/**
 * Stackra file contract:
 * Purpose: `DIMENSION_REGISTRY`, the dimension-typed fields of each model `registerDimensions` stored, by model key.
 * Boundary: process-wide and internal: written by `registerDimensions`, read by the decision point. A later row for the
 *           same model and field replaces the earlier one.
 * Runtime: isomorphic
 * Governing contract: ADR 0351 (decisions 2 and 3); ADR 0294 (decision 22).
 */
import type { DimensionRegistration } from "#core/types/dimension-registration.type";

/** Model key to its dimension-typed fields. */
export const DIMENSION_REGISTRY = new Map<string, readonly DimensionRegistration[]>();
