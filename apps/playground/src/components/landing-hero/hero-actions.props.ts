/**
 * Stackra file contract:
 * Purpose: `HeroActionsProps`: props of `HeroActions`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); ADR 0303 (props vocabulary).
 */
import type { ReactNode } from "react";

/** Props of {@link HeroActions}. */
export interface HeroActionsProps {
  /** A hero's own control, after the ways in (the storm's pause). */
  readonly children?: ReactNode;
}
