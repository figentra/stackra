/**
 * Stackra file contract:
 * Purpose: the Theme Studio route of @figentra/playground: its path and title. It names no category, so the gallery
 *          and the palette list it apart from the component pages; the shell's bar and the index link to it.
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0320 (the Theme Studio).
 */
import { Route } from "@stackra/navigation";

/** The Theme Studio, at `/theme-studio`. */
export class ThemeStudioRoute extends Route({ path: "/theme-studio" }) {
  /** The page title. */
  static readonly title = "Theme Studio";
}
