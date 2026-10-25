/**
 * Stackra file contract:
 * Purpose: `OutcomeParam`, one parameter an outcome kind takes (a refund window's days, a fee's amount, a hold's
 *          reason): a typed field, and, for a number, the market-pack floor key its value may never cross.
 * Boundary: a type only. It is a `FactField` (type, label, enum values) plus `floor`, the dotted key of a legal floor in
 *           the market pack (`consumer.withdrawal_days`); the floor's value and bound are pack data, never code. Only a
 *           number parameter names a floor. A geo parameter is refused: an outcome carries amounts, codes and text.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 9: consumers own the outcome); ADR 0370 (decision 6: floors are pack data);
 *                     config-model section 4 (a rule outcome never crosses a floor).
 */
import type { FactField } from "#contracts/types/fact-field.type";

/**
 * One parameter of an outcome kind.
 *
 * @example
 * const days: OutcomeParam = { type: FieldType.Number, label: "returns::outcomes.days", floor: "consumer.withdrawal_days" };
 */
export interface OutcomeParam extends FactField {
  /** The market-pack floor key the value is guarded against; a number parameter only. */
  readonly floor?: string;
}
