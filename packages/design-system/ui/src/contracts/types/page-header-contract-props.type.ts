/**
 * Stackra file contract:
 * Purpose: the props every runtime's `PageHeader` takes: the top of a page. It holds the breadcrumb trail, the title
 *          (the page's `h1` by default), a line under it, a `status` next to the title and the page's `actions`: an
 *          ordered list whose first entry is the primary action, at most three of which show as buttons, the rest
 *          going in an ActionMenu. Each runtime's `PageHeaderProps` is this plus its own base props, which pass
 *          through unchanged.
 * Boundary: types only. An action is the shared `MenuLeafItem` (key, text, icon, tone, disabled state, `href` and
 *           `onPress`), so the entries that overflow go into the menu unchanged. `status` is a node, usually a
 *           `StatusBadge`, so PageHeader imports no sibling piece of its wave (ADR 0317 decision 4); it builds on the
 *           earlier waves' Breadcrumbs, Heading, Button and ActionMenu.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4 and 5); WCAG 2.2 SC 1.3.1,
 *          2.4.6 and 2.4.8.
 */
import type { ReactNode } from "react";

import type { BreadcrumbItem } from "#contracts/types/breadcrumb-item.type";
import type { LandmarkContractProps } from "#contracts/types/landmark-contract-props.type";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import type { ShellSlotsContractProps } from "#contracts/types/shell-slots-contract-props.type";
import type { TitledContractProps } from "#contracts/types/titled-contract-props.type";

/** Props shared by the web and native `PageHeader`. `startContent` leads the title, `endContent` follows the actions. */
export interface PageHeaderContractProps
  extends TitledContractProps, LandmarkContractProps, ShellSlotsContractProps {
  /** The trail from the root to the current page, drawn above the title; left out or empty, there is no trail. */
  readonly breadcrumbs?: readonly BreadcrumbItem[] | undefined;
  /** The state of the page's record, drawn beside the title, usually a `StatusBadge`. */
  readonly status?: ReactNode | undefined;
  /** The page's actions in priority order: the first is primary, three at most show and the rest go in an ActionMenu. */
  readonly actions?: readonly MenuLeafItem[] | undefined;
  /** The accessible name of the ActionMenu button the overflowing actions go in. Defaults to the `ui` catalogue's phrase in the active locale. */
  readonly moreActionsLabel?: string | undefined;
}
