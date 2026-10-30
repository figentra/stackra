/**
 * Stackra file contract:
 * Purpose: `MoneyFieldProps`, the props of the web `MoneyField` in `money-field.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); gap inventory row 2.
 */
import type { MoneyFieldContractProps } from "#contracts/types/money-field-contract-props.type";
import type { NumberFieldProps } from "#react/number-field/number-field.props";

/**
 * Props of the web MoneyField: the shared contract plus the web NumberField's own props, passed through unchanged. The
 * number format is the currency's, so `formatOptions` is refused.
 */
export type MoneyFieldProps = MoneyFieldContractProps &
  Omit<NumberFieldProps, keyof MoneyFieldContractProps | "formatOptions">;
