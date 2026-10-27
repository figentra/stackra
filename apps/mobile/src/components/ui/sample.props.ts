/**
 * Stackra file contract:
 * Purpose: `SampleProps`: props of `Sample`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ReactNode } from "react";

/** Props of {@link Sample}. */
export interface SampleProps {
  /** The option the sample shows, for example a variant name. */
  caption: string;
  /** The component drawn above the caption. */
  children: ReactNode;
}
