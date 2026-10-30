/**
 * Stackra file contract:
 * Purpose: `SidePanelApi`, what a `SidePanel` shares with its parts and with `useSidePanel`: the state and its setter,
 *          the width and its bounds, whether it is a drawer on this screen, and the ids its controls point at.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); owner request 2026-10-29 (STA-1371, side panel).
 */
import type { SidePanelVariant } from "#contracts/enums/side-panel-variant.enum";
import type { SidePanelState } from "#contracts/enums/side-panel-state.enum";

/** The shared state of one side panel. */
export interface SidePanelApi {
  /** The id of the panel, for a control's `aria-controls`. */
  readonly panelId: string;
  /** The panel's spoken name. */
  readonly label: string;
  /** The state now. */
  readonly state: SidePanelState;
  /** Moves to a state. */
  readonly setState: (state: SidePanelState) => void;
  /** The open width in pixels, within the bounds. */
  readonly width: number;
  /** Sets the open width; the value is clamped to the bounds. */
  readonly setWidth: (width: number) => void;
  /** The narrowest width. */
  readonly minWidth: number;
  /** The widest width. */
  readonly maxWidth: number;
  /** True below `drawerBelow`, where the panel is a drawer over the page instead of a column of it. */
  readonly isDrawer: boolean;
  /** True until the state first changes after mount; a drawer opens only from a change, never on load. */
  readonly isInitial: boolean;
  /** The look: a bordered column, or a card split from the page. */
  readonly variant: SidePanelVariant;
}
