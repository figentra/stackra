/**
 * Stackra file contract:
 * Purpose: `maskOf`, what a masked copy (a staging copy, a seed pack) writes for each classified field of a model: its
 *          effective class's `mask` effect. A field with no class is copied as it is.
 * Boundary: pure over `fieldDataClasses`; the masker applies the methods, and never keeps its own list of columns.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 1: the `mask` effect); data-layer gap gov15.
 */
import type { AnyClass } from "@stackra/container";

import type { MaskMethod } from "#core/enums/mask-method.enum";
import { fieldDataClasses } from "#core/functions/field-data-classes.function";

/**
 * Each classified field of `type` and its mask method.
 *
 * @example
 * maskOf(Customer).get("email"); // "fake" for a @Classified(DataClassification.Personal) field
 */
export function maskOf(type: AnyClass): ReadonlyMap<string | symbol, MaskMethod> {
  return new Map([...fieldDataClasses(type)].map(([field, dataClass]) => [field, dataClass.mask]));
}
