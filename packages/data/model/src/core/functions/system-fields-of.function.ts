/**
 * Stackra file contract:
 * Purpose: `systemFieldsOf(model)`, the system-written fields of one model: those `SYSTEM_FIELDS` lists for each trait
 *          the model carries.
 * Boundary: reads the trait registry through `traitsOf`; never instantiates the model. A model without any of those
 *           traits has none.
 * Runtime: isomorphic
 * Governing contract: data-layer gap mo21 (stackra-287); ADR 0096 (the trait registry).
 */
import { SYSTEM_FIELDS } from "#core/constants/system-fields.constant";
import { traitsOf } from "#core/functions/traits-of.function";
import type { SystemField } from "#core/types/system-field.type";

/**
 * The system-written fields of `model`.
 *
 * @example
 * systemFieldsOf(Order); // ["id", "createdAt", "updatedAt", "version"]
 */
export function systemFieldsOf(model: object): readonly SystemField[] {
  const lists = SYSTEM_FIELDS as Readonly<Record<string, readonly SystemField[]>>;
  return traitsOf(model).flatMap((trait) => lists[trait.name] ?? []);
}
