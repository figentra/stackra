/**
 * Stackra file contract:
 * Purpose: `SchematicProps`, the props of the web `Schematic` in `schematic.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); ADR 0501 (section 9, the blueprint
 *          roles); STA-2041.
 */
import type { ReactNode } from "react";

import type { SchematicLink } from "#contracts/types/schematic-link.type";

/** Props of the web Schematic. */
export interface SchematicProps {
  /** The machine's spoken name, which names the group. */
  readonly label: string;
  /** The `SchematicNode`s, laid out by the caller through `className` (a grid or a flex row). */
  readonly children: ReactNode;
  /**
   * The pipes, each from the bottom centre of one node to the top centre of another, listed in drawing order: a pipe
   * leaving a node waits for the pipe that reaches it.
   */
  readonly links: readonly SchematicLink[];
  /** Draws the pipes in on floor steps the first time the machine comes into view, at the `full` motion level. Defaults to true. */
  readonly drawOnView?: boolean | undefined;
  /** Styles the machine, and lays out its nodes. */
  readonly className?: string | undefined;
}
