/**
 * Stackra file contract:
 * Purpose: `SegmentedControlProps`, the props of the web `SegmentedControl` in `segmented-control.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { RadioGroupProps } from "react-aria-components";
import type { SegmentedControlContractProps } from "#contracts/types/segmented-control-contract-props.type";

/** Props of the web SegmentedControl: the shared contract plus React Aria's RadioGroup props, passed through. */
export type SegmentedControlProps = SegmentedControlContractProps &
  Omit<
    RadioGroupProps,
    | keyof SegmentedControlContractProps
    | "children"
    | "value"
    | "defaultValue"
    | "onChange"
    | "orientation"
  >;
