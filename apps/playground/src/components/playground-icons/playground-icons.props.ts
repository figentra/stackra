/**
 * Stackra file contract:
 * Purpose: `PlaygroundIconsProps`: props of `PlaygroundIcons`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ReactNode } from "react";

/** Props of {@link PlaygroundIcons}. */
export interface PlaygroundIconsProps {
  /** The tree whose pages draw icons. */
  children: ReactNode;
}
