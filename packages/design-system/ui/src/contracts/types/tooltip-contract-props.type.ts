/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Tooltip` takes: the element it describes, the short text it shows, and the
 *          shared open state and placement props. The web `TooltipProps` is this plus HeroUI's tooltip root props,
 *          which pass through unchanged.
 * Boundary: types only; a tooltip is a label, never a place for a control or a link, so `content` is plain text. A
 *           tooltip never replaces an accessible name: the element it describes keeps its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 1.4.13.
 */
import type { ReactElement } from "react";

import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import type { PlacementContractProps } from "#contracts/types/placement-contract-props.type";

/** Props shared by the web and native `Tooltip`. */
export interface TooltipContractProps extends OpenStateContractProps, PlacementContractProps {
  /**
   * The element the tooltip describes: one focusable, pressable element such as a Button or an IconButton. On web the
   * tooltip shows on hover and on keyboard focus; on native it becomes the element's accessibility hint.
   */
  readonly children: ReactElement;
  /** What the tooltip says: one short phrase, the sort a hover label carries, set in the app's language. */
  readonly content: string;
  /** True to draw an arrow from the tooltip to the element. Web only; native draws no tooltip. Defaults to false. */
  readonly hasArrow?: boolean | undefined;
}
