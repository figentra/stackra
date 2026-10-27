/**
 * Stackra file contract:
 * Purpose: `PaletteAction`: a command the shell offers in the palette: switch the scheme, the language, go somewhere.
 * Boundary: a type only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0305 (rule 10).
 */
import type { IconName } from "@stackra/icons/contracts";

/** A command the shell offers in the palette: switch the scheme, the language, go somewhere. */
export interface PaletteAction {
  /** A stable id, unique among the actions. */
  readonly id: string;
  /** What the row says. */
  readonly label: string;
  /** A short line under it. */
  readonly detail: string;
  /** The icon, by name. */
  readonly icon: IconName;
  /** Other words it is found by. */
  readonly keywords?: string;
  /** Carries the action out; the palette closes after it. */
  readonly run: () => void;
}
