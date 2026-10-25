/**
 * Stackra file contract:
 * Purpose: `QuantityUnit`, the code of a unit a `Quantity` carries (`kg`, `cm`, `in`, `ml`, `piece`).
 * Boundary: a type only, derived from `QUANTITY_UNITS`, so a unit exists exactly when it has an exact factor.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file).
 */
import type { QUANTITY_UNITS } from "#core/constants/quantity-units.constant";

/** A unit code. */
export type QuantityUnit = keyof typeof QUANTITY_UNITS;
