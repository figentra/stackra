/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Section` takes: a titled card on a detail page, holding a title (a heading, `h2`
 *          by default) with an optional line under it, the section's `actions` (the first primary, three at most shown
 *          as buttons, the rest in an ActionMenu) and its body. Each runtime's `SectionProps` is this plus its own base
 *          props, which pass through unchanged.
 * Boundary: types only. An action is the shared `MenuLeafItem`, so the entries that overflow go into the menu
 *           unchanged, as in PageHeader. The section is named by its `title`; `label` is only for a page that holds two
 *           sections with the same title.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0314 (decisions 1, 4 and 5); WCAG 2.2 SC 1.3.1
 *          and 2.4.6.
 */
import type { ReactNode } from "react";

import type { LandmarkContractProps } from "#contracts/types/landmark-contract-props.type";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import type { ShellSlotsContractProps } from "#contracts/types/shell-slots-contract-props.type";
import type { TitledContractProps } from "#contracts/types/titled-contract-props.type";

/**
 * Props shared by the web and native `Section`. `startContent` leads the title and `endContent` follows the actions.
 * `headingLevel` defaults to 2.
 */
export interface SectionContractProps
  extends TitledContractProps, LandmarkContractProps, ShellSlotsContractProps {
  /** The section's actions in priority order: the first is primary, three at most show and the rest go in a menu. */
  readonly actions?: readonly MenuLeafItem[] | undefined;
  /** The accessible name of the ActionMenu button the overflowing actions go in. Defaults to an English phrase. */
  readonly moreActionsLabel?: string | undefined;
  /** The body of the section. */
  readonly children?: ReactNode;
}
