/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Popover` takes: a trigger, the rich content that opens anchored to it, an
 *          optional title that names it, and the shared open state, dismissal and placement props. Each runtime's
 *          `PopoverProps` is this plus its HeroUI popover content's own props, which pass through unchanged.
 * Boundary: types only; one flat component, so the compound parts HeroUI's two runtimes disagree on (web has a dialog
 *           inside the content, native has a portal and an overlay) never reach the caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.1.2, 4.1.2.
 */
import type { ReactElement, ReactNode } from "react";

import type { OverlayContractProps } from "#contracts/types/overlay-contract-props.type";
import type { PlacementContractProps } from "#contracts/types/placement-contract-props.type";

/** Props shared by the web and native `Popover`. */
export interface PopoverContractProps extends OverlayContractProps, PlacementContractProps {
  /**
   * The pressable that opens the popover, usually a Button. It keeps its own accessible name; the popover only adds
   * the pressed and expanded state.
   */
  readonly trigger: ReactElement;
  /**
   * The popover's content: text, a form, a list of actions. Anything the user must be able to dismiss needs a
   * control of its own when `isDismissable` is false. Plain text is wrapped for the runtime.
   */
  readonly children: ReactNode;
  /**
   * The popover's heading, which also names it for assistive technology. Without it, name the content with
   * `aria-label` (web) so a screen reader does not announce an unnamed dialog.
   */
  readonly title?: string | undefined;
  /** True to draw an arrow from the content to its trigger. Defaults to false. */
  readonly hasArrow?: boolean | undefined;
}
