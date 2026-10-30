/**
 * Stackra file contract:
 * Purpose: `TocRailContractProps`, the props of every runtime's `TocRail`: an "On this page" list that marks the
 *          section in view, as a rail beside the content or a floating button that opens it.
 * Boundary: types only. On web, without `activeId`, the rail follows the headings in view itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { TocItem } from "#contracts/types/toc-item.type";

/** Props shared by the web and native `TocRail`. */
export interface TocRailContractProps {
  /** The entries of the table of contents, in page order. */
  readonly items: readonly TocItem[];
  /** The id of the section in view, for a controlled rail. */
  readonly activeId?: string | undefined;
  /** Called with the id chosen; on web the page also scrolls to it. */
  readonly onSelect?: ((id: string) => void) | undefined;
  /** `rail` (the default) is a list; `floating` is a button at the bottom end that opens it. */
  readonly variant?: "rail" | "floating" | undefined;
  /** The navigation's name; "On this page" by default. */
  readonly label?: string | undefined;
}
