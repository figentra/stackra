/**
 * Stackra file contract:
 * Purpose: `ThemeStep`: one step of the history: the base theme and the knobs on it.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (Stackra Design System); ADR 0305 (rule 10).
 */
import type { Theme, ThemeKnobs } from "@stackra/tokens/contracts";

/** One step of the history: the base theme and the knobs on it. */
export interface ThemeStep {
  /** The theme the knobs derive from: the stackra theme, or an imported one. */
  readonly base: Theme;
  /** The knobs on the base. */
  readonly knobs: ThemeKnobs;
}
