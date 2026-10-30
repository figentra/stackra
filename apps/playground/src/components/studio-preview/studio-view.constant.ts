/**
 * Stackra file contract:
 * Purpose: `STUDIO_VIEW`: the view the studio opens on, and the choices each part of the view offers.
 * Boundary: data only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */
import type { StudioView } from "./studio-view.type";

/** The opening view. */
export const STUDIO_VIEW: StudioView = {
  device: "desktop",
  isLandscape: false,
  zoom: "fit",
  isSideBySide: false,
};
