/**
 * Stackra file contract:
 * Purpose: `SectionDockProps`, the props of the web `SectionDock` in `section-dock.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-2041.
 */
import type { SectionDockItem } from "#contracts/types/section-dock-item.type";

/** Props of the web SectionDock. */
export interface SectionDockProps {
  /** The navigation's spoken name, such as "Sections". */
  readonly label: string;
  /** The page's sections in reading order, each with the status line the dock shows while it is current. */
  readonly items: readonly SectionDockItem[];
  /** Styles the dock. */
  readonly className?: string | undefined;
}
