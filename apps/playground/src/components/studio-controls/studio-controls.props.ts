/**
 * Stackra file contract:
 * Purpose: `StudioControlsProps`: props of `StudioControls`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { Theme } from "@stackra/tokens/contracts";

import type { StudioFonts } from "./studio-fonts.type";
import type { StudioKnobs } from "./studio-knobs.type";

/** Props of {@link StudioControls}. */
export interface StudioControlsProps {
  /** The rail section whose controls are shown. */
  section: "brand" | "colours" | "type" | "shape" | "motion" | "effects" | "recipes";
  /** The knobs on screen. */
  knobs: StudioKnobs;
  /** The theme the knobs apply to (the picked brand's or the imported one); a knob left unset shows its value. */
  base: Theme;
  /** The name of the base theme, the label of the preset that keeps it as it is. */
  baseLabel: string;
  /** The display stacks in force, which the display face pickers show. */
  fonts: StudioFonts;
  /** The scheme the samples (shadows) are drawn for. */
  scheme: "light" | "dark";
  /** Called with the whole new set of knobs after a change. */
  onChange: (knobs: StudioKnobs) => void;
  /** The knob names locked against Randomize. */
  locks: readonly string[];
  /** Called when a knob's lock is turned on or off. */
  onLockChange: (name: string, isLocked: boolean) => void;
}
