/**
 * Stackra file contract:
 * Purpose: every CSS custom property the glass material writes on the web, by name: per level its share, blur,
 *          saturation, fill and filter; the edge, rim light and sheen; and the mode factors. `defineTheme` checks that
 *          no palette or other token writes one of them, and `renderWebCss` writes them.
 * Boundary: names only (without the leading `--`).
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material).
 */
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import { MaterialRole } from "#contracts/enums/material-role.enum";

/** The custom properties of the glass material. */
export const MATERIAL_PROPERTIES: readonly string[] = Object.freeze([
  ...MaterialLevel.flatMap((level) =>
    [
      "share",
      "blur",
      "saturate",
      "fill",
      "filter",
      "edge",
      "rim",
      "specular",
      "depth",
      "elevation",
      "dim",
      "label-fill",
    ].map((part) => `material-${level}-${part}`),
  ),
  "material-control-fill",
  "material-edge-share",
  "material-highlight-share",
  "material-edge",
  "material-highlight",
  "material-sheen",
  "material-sheen-color",
  "material-fill-scale",
  "material-fill-floor",
  "material-thick-floor",
  "material-blur-scale",
  "material-saturate-scale",
  "material-brightness",
  "material-specular-scale",
  "material-clear-floor",
  "material-tint-scale",
  "material-rim-scale",
  "material-edge-floor",
  "floating-shadow",
  ...[...MaterialRole, "nav-bar-scrolled"].flatMap((role) =>
    ["fill", "label-fill", "filter", "edge", "rim", "specular", "depth", "elevation"].map(
      (part) => `material-role-${role}-${part}`,
    ),
  ),
]);
