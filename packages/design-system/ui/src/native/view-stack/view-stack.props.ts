/**
 * Stackra file contract:
 * Purpose: `ViewStackProps`, the props of the native `ViewStack` in `view-stack.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ViewStackContractProps } from "#contracts/types/view-stack-contract-props.type";

/** Props of the native ViewStack: the shared contract. */
export type ViewStackProps = ViewStackContractProps;
