/**
 * Stackra file contract:
 * Purpose: `ComponentCardProps`: props of `ComponentCard`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec (2026-10-27) section 5.
 */
import type { ComponentEntry } from "@stackra/showcase";
import type { ReactNode } from "react";

/** Props of {@link ComponentCard}. */
export interface ComponentCardProps {
  /** The registry entry the card shows. */
  readonly entry: ComponentEntry;
  /** A fixed width in points (a shelf's card); without it the card fills its grid cell. */
  readonly width?: number | undefined;
  /** Called with the entry on press. */
  readonly onPress?: (entry: ComponentEntry) => void;
  /** The live thumbnail (one of the entry's demos); the category glyph stands in without one. */
  readonly preview?: ReactNode;
}
