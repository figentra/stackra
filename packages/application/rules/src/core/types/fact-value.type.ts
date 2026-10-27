/**
 * Stackra file contract:
 * Purpose: `FactValue`, the value a consumer supplies for one registered field: the runtime form of its `FieldType`.
 * Boundary: a type only. String and enum fields take a `string`, number a finite `number`, money a `Money`, date a
 *           `Date`, list a `string[]` and geo a `GeoPoint`; a missing fact is `null` or left out. A value of the wrong
 *           form is the consumer's bug, and `evaluate` throws on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 3 and 4); ADR 0220 (money).
 */
import type { GeoPoint } from "@stackra/contracts";
import type { Money } from "@stackra/money";

/** One fact: the runtime value of a registered field. */
export type FactValue = string | number | Money | Date | readonly string[] | GeoPoint;
