/**
 * Stackra file contract:
 * Purpose: `ShowcaseToastsProps`: props of `ShowcaseToasts`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ReactNode } from "react";

/** Props of {@link ShowcaseToasts}. */
export interface ShowcaseToastsProps {
  /** The app below the toast stack. */
  children: ReactNode;
}
