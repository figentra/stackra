/**
 * Stackra file contract:
 * Purpose: the props the web `ActionPalette` (HeroUI Pro's Command) takes from the shared vocabulary: the root's
 *          children, and the accessible names of the dialog and of its search input.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0294 (decision 23: Command is a CLI command
 *          only); STA-403 FR-004.
 */
import type { ReactNode } from "react";

/** Props of the `ActionPalette` root. */
export interface ActionPaletteContractProps {
  /** The palette's parts, usually a backdrop holding a container and a dialog. */
  readonly children: ReactNode;
}
