/**
 * Stackra file contract:
 * Purpose: `MoneyFieldProps`, the props of the native `MoneyField` in `money-field.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); gap inventory row 2.
 */
import type { MoneyFieldContractProps } from "#contracts/types/money-field-contract-props.type";
import type { NumberFieldProps } from "#native/number-field/number-field.props";

/** Props of the native MoneyField: the shared contract plus the native NumberField's props, except its format. */
export type MoneyFieldProps = MoneyFieldContractProps &
  Omit<NumberFieldProps, keyof MoneyFieldContractProps | "formatOptions">;
