/**
 * Stackra file contract:
 * Purpose: `ViewStackBackProps`, the props of the web `ViewStack.Back` in `view-stack-back.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ViewStackBackContractProps } from "#contracts/types/view-stack-back-contract-props.type";

/** Props of the web ViewStack.Back: the shared contract. */
export type ViewStackBackProps = ViewStackBackContractProps;
