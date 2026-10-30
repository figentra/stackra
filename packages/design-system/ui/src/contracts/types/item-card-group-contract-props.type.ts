/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ItemCardGroup` takes: ItemCards joined into one surface with separators, under
 *          an optional heading.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `ItemCardGroup`. */
export interface ItemCardGroupContractProps {
  /** The heading over the group; it names the group's list. */
  readonly title?: string | undefined;
  /** A line under the group, for example a footnote. */
  readonly description?: string | undefined;
  /** The ItemCards (or SettingsCells). */
  readonly children: ReactNode;
}
