/**
 * Stackra file contract:
 * Purpose: `StudioControlsProps`: props of `StudioControls`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ThemeKnobs } from "@stackra/tokens/contracts";

/** Props of {@link StudioControls}. */
export interface StudioControlsProps {
  /** The knobs on screen. */
  knobs: ThemeKnobs;
  /** Called with the whole new set of knobs after a change. */
  onChange: (knobs: ThemeKnobs) => void;
}
