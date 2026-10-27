/**
 * Stackra file contract:
 * Purpose: `ThemeSettings`: what the settings hold at one moment.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (Stackra Design System); ADR 0305 (rule 10).
 */
import type { Theme } from "@stackra/tokens/contracts";
import type { ThemeStep } from "./theme-step.type";

/** What the settings hold at one moment. */
export interface ThemeSettings {
  /** Steps that undo walks back to, oldest first. */
  readonly past: readonly ThemeStep[];
  /** The committed step. */
  readonly present: ThemeStep;
  /** The step a moving slider shows before it is let go. */
  readonly draft: ThemeStep | undefined;
  /** Steps that redo walks forward to, nearest first. */
  readonly future: readonly ThemeStep[];
  /** The theme on screen: the derived one, or the last good one when the knobs make an invalid theme. */
  readonly theme: Theme;
  /** Why the knobs make no usable theme; empty when they do. */
  readonly problems: readonly string[];
}
