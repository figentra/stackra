/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TwoColumnLayout` takes: the frame of a detail page with a main column and a side
 *          column. On web the side column sits beside the main one from `collapseBelow` up and stacks under it below;
 *          it follows the writing direction, so in right-to-left it is at the left. Native has one column always.
 * Boundary: types only. Both columns are nodes, so the layout imports no sibling piece (ADR 0317 decision 4). The side
 *           column holds supporting records (a summary, a history); it is read after the main one in every layout, so
 *           the reading order and the tab order never depend on the width.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0317 (decisions 1, 6 and 7); WCAG 2.2 SC 1.3.2
 *          and 1.4.10.
 */
import type { ReactNode } from "react";

import type { LayoutBreakpointContractProps } from "#contracts/types/layout-breakpoint-contract-props.type";

/** Props shared by the web and native `TwoColumnLayout`. `collapseBelow` defaults to `lg`. */
export interface TwoColumnLayoutContractProps extends LayoutBreakpointContractProps {
  /** The main column's blocks, from top to bottom. */
  readonly children?: ReactNode;
  /** The side column's blocks, from top to bottom. Required: a layout with no side column is a SingleColumnLayout. */
  readonly aside: ReactNode;
}
