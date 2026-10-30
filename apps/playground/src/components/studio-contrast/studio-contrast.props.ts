/**
 * Stackra file contract:
 * Purpose: `StudioContrastProps`: props of `StudioContrast`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { Theme } from "@stackra/tokens/contracts";

/** Props of {@link StudioContrast}. */
export interface StudioContrastProps {
  /** The theme to measure. */
  theme: Theme;
  /** The scheme measured. */
  scheme: "light" | "dark";
}
