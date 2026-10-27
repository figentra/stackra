/**
 * Stackra file contract:
 * Purpose: `ChoiceProps`: props of `Choice`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ReactNode } from "react";

/** Props of {@link Choice}. */
export interface ChoiceProps {
  /** The key the group selects it by. */
  id: string;
  /** The accessible name when the visible content is an icon or an abbreviation. */
  "aria-label"?: string;
  /** The visible content. */
  children: ReactNode;
}
