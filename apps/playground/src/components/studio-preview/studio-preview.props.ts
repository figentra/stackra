/**
 * Stackra file contract:
 * Purpose: `StudioPreviewProps`: props of `StudioPreview`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { Theme } from "@stackra/tokens/contracts";

import type { StudioFonts } from "#src/components/studio-controls";

import type { StudioView } from "./studio-view.type";

/** Props of {@link StudioPreview}. */
export interface StudioPreviewProps {
  /** The theme to show. */
  theme: Theme;
  /** The scheme the canvas is drawn in (both, side by side, when the view asks). */
  scheme: "light" | "dark";
  /** The device, its orientation, the zoom and side by side (the top bar's Display settings). */
  view: StudioView;
  /** The display stacks the templates' headings use. */
  fonts: StudioFonts;
}
