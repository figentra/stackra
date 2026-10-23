/**
 * Stackra file contract:
 * Purpose: the props the web `ContextMenu` compound takes from the shared vocabulary: the controlled open state (`isOpen`) and the accessible name of its menu.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { ReactNode } from "react";

/** Props of the `ContextMenu` root that the Stackra vocabulary names. */
export interface ContextMenuContractProps {
  /** The trigger area and the popover that opens on a secondary press. */
  readonly children: ReactNode;
  /** The controlled open state; HeroUI Pro's `open`. Uncontrolled when left out. */
  readonly isOpen?: boolean | undefined;
}

/** Props of `ContextMenu.Menu` that the Stackra vocabulary names. */
export interface ContextMenuMenuContractProps {
  /** The accessible name of the menu, required by its menu role; HeroUI Pro's `aria-label`. */
  readonly label: string;
}
