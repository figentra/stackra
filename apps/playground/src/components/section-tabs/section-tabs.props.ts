/**
 * Stackra file contract:
 * Purpose: `SectionTabsProps`: props of `SectionTabs`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec section 3.2.
 */
import type { ComponentEntry } from "@stackra/showcase";

/** Props of {@link SectionTabs}. */
export interface SectionTabsProps {
  /** The entry whose page is on screen. */
  entry: ComponentEntry;
  /** Layout classes for the host. */
  className?: string | undefined;
}
