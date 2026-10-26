/**
 * Stackra file contract:
 * Purpose: `NumberFieldProps`, the props of the web `NumberField` in `number-field.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318 (decision 9); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055 (forms: one field contract);
 *          owner decision 6 of STA-350 (thin wrappers).
 */
import type { NumberFieldRootProps } from "@heroui/react";
import type { NumberFieldContractProps } from "#contracts/types/number-field-contract-props.type";

/**
 * Props of the web NumberField: the shared contract plus HeroUI v3's own number field props, passed through unchanged.
 * HeroUI's `fullWidth` is the contract's `isFullWidth`, its two button names are `incrementLabel` and `decrementLabel`,
 * and `children` is refused because the field draws its own parts.
 */
export type NumberFieldProps = NumberFieldContractProps &
  Omit<
    NumberFieldRootProps,
    | keyof NumberFieldContractProps
    | "children"
    | "fullWidth"
    | "incrementAriaLabel"
    | "decrementAriaLabel"
  >;
