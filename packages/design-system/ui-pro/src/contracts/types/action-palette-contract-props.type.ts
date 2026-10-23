/**
 * Stackra file contract:
 * Purpose: the props the web `ActionPalette` (HeroUI Pro's Command) takes from the shared vocabulary: the root's
 *          children, and the accessible names of the dialog and of its search input.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0294 (decision 23: Command is a CLI command
 *          only); STA-403 FR-004.
 */
import type { ReactNode } from "react";

/** Props of the `ActionPalette` root. */
export interface ActionPaletteContractProps {
  /** The palette's parts, usually a backdrop holding a container and a dialog. */
  readonly children: ReactNode;
}

/** Props of `ActionPalette.Dialog` that the Stackra vocabulary names. */
export interface ActionPaletteDialogContractProps {
  /** The accessible name of the dialog; HeroUI Pro's `aria-label`, which defaults to "Command palette". */
  readonly label?: string | undefined;
}

/** Props of `ActionPalette.InputGroup` that the Stackra vocabulary names. */
export interface ActionPaletteInputGroupContractProps {
  /** The accessible name of the search field; HeroUI Pro's `aria-label`, which defaults to "Search commands". */
  readonly label?: string | undefined;
}
