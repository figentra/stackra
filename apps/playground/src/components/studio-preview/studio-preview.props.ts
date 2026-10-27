/**
 * Stackra file contract:
 * Purpose: `StudioPreviewProps`: props of `StudioPreview`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { Theme } from "@stackra/tokens/contracts";

/** Props of {@link StudioPreview}. */
export interface StudioPreviewProps {
  /** The theme to show. */
  theme: Theme;
  /** The colour scheme on screen. */
  scheme: "light" | "dark";
}
