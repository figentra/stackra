/**
 * Stackra file contract:
 * Purpose: the props every runtime's `NavigationHeader` takes: the compact header of one screen. From the logical
 *          start it holds the back button (when `onBack` or `backHref` is given), the `startContent` slot, the `title`
 *          and the `endContent` slot (the screen's actions); with `hasLargeTitle` the title is drawn large under the
 *          bar instead, as an iOS large-title header does. Each runtime's `NavigationHeaderProps` is this plus its own
 *          base props, which pass through unchanged.
 * Boundary: types only. Every part but the title is a node or a handler, so the header imports no other shell piece
 *           (ADR 0317 decision 4); on web it is the compact form of PageHeader and does not import it. Router wiring is
 *           `@stackra/navigation`'s: it passes `onBack` from the navigator, and `backHref` is for a plain link.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4, 5 and 7); ADR 0060; WCAG
 *          2.2 SC 1.3.1, 2.4.6 and 2.5.8.
 */
import type { ReactNode } from "react";

import type { HeadingLevel } from "#contracts/enums/heading-level.enum";
import type { LandmarkContractProps } from "#contracts/types/landmark-contract-props.type";
import type { ShellSlotsContractProps } from "#contracts/types/shell-slots-contract-props.type";

/** Props shared by the web and native `NavigationHeader`. */
export interface NavigationHeaderContractProps
  extends LandmarkContractProps, ShellSlotsContractProps {
  /** What the screen is called, in a few words. Required: it is the heading a screen reader announces for the screen. */
  readonly title: ReactNode;
  /** The title's place in the document outline, 1 to 6, on web. Defaults to 1; native has no levels and ignores it. */
  readonly headingLevel?: HeadingLevel | undefined;
  /** True to draw the title large under the bar, which then holds only the back button and the slots. */
  readonly hasLargeTitle?: boolean | undefined;
  /** Called when the back button is pressed; giving it draws the button. */
  readonly onBack?: (() => void) | undefined;
  /** Where the back button leads when it is a link; giving it draws the button, which also calls `onBack` first. */
  readonly backHref?: string | undefined;
  /** The accessible name of the back button. Defaults to `ui::navigation_header.back` in the active locale. */
  readonly backLabel?: string | undefined;
}
