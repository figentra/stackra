/**
 * Stackra file contract:
 * Purpose: `SidebarProps`: props of `Sidebar`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec section 3.2.
 */
import type { ComponentEntry } from "@stackra/showcase";

/** Props of {@link Sidebar}. */
export interface SidebarProps {
  /** The entry on screen, marked current. */
  current?: ComponentEntry | undefined;
  /** Layout classes for the host (sticky on a wide screen, plain inside the drawer). */
  className?: string | undefined;
}
