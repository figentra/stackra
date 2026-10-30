/**
 * Stackra file contract:
 * Purpose: `SplitViewProps`, the props of the web `SplitView` in `split-view.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ComponentPropsWithoutRef } from "react";
import type { SplitViewContractProps } from "#contracts/types/split-view-contract-props.type";

/** Props of the web SplitView: the shared contract plus the root's own props, passed through. */
export type SplitViewProps = SplitViewContractProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof SplitViewContractProps>;
