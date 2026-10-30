/**
 * Stackra file contract:
 * Purpose: `ViewStackViewProps`, the props of the web `ViewStack.View` in `view-stack-view.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ViewStackViewContractProps } from "#contracts/types/view-stack-view-contract-props.type";

/** Props of the web ViewStack.View: the shared contract. */
export type ViewStackViewProps = ViewStackViewContractProps;
