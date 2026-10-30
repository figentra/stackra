/**
 * Stackra file contract:
 * Purpose: `TocRailProps`: props of `TocRail`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec section 3.2.
 */
import type { ComponentEntry } from "@stackra/showcase";

/** Props of {@link TocRail}. */
export interface TocRailProps {
  /** The entry whose page is on screen. */
  entry: ComponentEntry;
  /** Layout classes for the host. */
  className?: string | undefined;
  /** `rail`: the sticky column of a wide screen; `menu`: the "On this page" disclosure at the top of the page. */
  variant?: "rail" | "menu" | undefined;
}
