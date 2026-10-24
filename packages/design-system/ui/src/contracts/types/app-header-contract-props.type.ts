/**
 * Stackra file contract:
 * Purpose: the props every runtime's `AppHeader` takes: the top bar of the console. From the logical start to the end it
 *          holds the `startContent` slot (the button that opens the sidebar), the `title` (the app's name or logo), the
 *          `search` slot (the palette trigger or a search field, taking the room left over), the `endContent` slot (the
 *          bar's actions, such as notifications) and the `userMenu` slot. Each runtime's `AppHeaderProps` is this plus
 *          its own base props, which pass through unchanged.
 * Boundary: types only. Every part is a node, so AppHeader imports no other shell piece (ADR 0314 decision 4): the app
 *           puts a Button in `startContent`, a SearchField in `search` and a Menu in `userMenu`. The title is not a
 *           heading, because the page's one `h1` belongs to PageHeader.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0314 (decisions 1, 4 and 5); WCAG 2.2 SC 1.3.1
 *          and 2.4.1.
 */
import type { ReactNode } from "react";

import type { LandmarkContractProps } from "#contracts/types/landmark-contract-props.type";
import type { ShellSlotsContractProps } from "#contracts/types/shell-slots-contract-props.type";

/** Props shared by the web and native `AppHeader`. */
export interface AppHeaderContractProps extends LandmarkContractProps, ShellSlotsContractProps {
  /** The app's name or logo, drawn after `startContent`; a string is drawn as semibold text. */
  readonly title?: ReactNode | undefined;
  /** The search slot, usually a `SearchField` or a button that opens the command palette; it takes the room left over. */
  readonly search?: ReactNode | undefined;
  /** The user's menu, usually a `Menu` on an avatar; it is the last part of the bar. */
  readonly userMenu?: ReactNode | undefined;
}
