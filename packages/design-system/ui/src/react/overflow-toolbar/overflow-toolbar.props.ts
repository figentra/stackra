/**
 * Stackra file contract:
 * Purpose: `OverflowToolbarProps`, the props of the web `OverflowToolbar` in `overflow-toolbar.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312.
 */
import type { HTMLAttributes } from "react";
import type { OverflowToolbarContractProps } from "#contracts/types/overflow-toolbar-contract-props.type";

/**
 * Props of the web OverflowToolbar: the shared contract plus the outer `div`'s own attributes, passed through. The
 * buttons are the component's, so `children` is refused, and `label` names the toolbar, so `aria-label` is too.
 */
export type OverflowToolbarProps = OverflowToolbarContractProps &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    keyof OverflowToolbarContractProps | "children" | "aria-label"
  >;
