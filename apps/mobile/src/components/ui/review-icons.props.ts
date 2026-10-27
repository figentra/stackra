/**
 * Stackra file contract:
 * Purpose: `ReviewIconsProps`: props of `ReviewIcons`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ReactNode } from "react";

/** Props of {@link ReviewIcons}. */
export interface ReviewIconsProps {
  /** The review screen or header part that draws icons by name. */
  readonly children: ReactNode;
}
