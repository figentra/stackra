/**
 * Stackra file contract:
 * Purpose: `KIT_SOURCES`, where each source file sits inside a kit folder, so every product kit is read the same way.
 * Boundary: data only; paths are kit-relative and `/`-separated. Optional sources (dark variants, the monochrome
 *           layer) fall back as `OUTPUT_SOURCES` states.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: product sources in <repo>/assets/brand).
 */

/** Kit-relative source paths. */
export const KIT_SOURCES = Object.freeze({
  kit: "kit.json",
  readme: "README.md",
  versions: "versions.json",
  seed: "seed.json",
  /** A stackra theme JSON (full export, changes-only diff over the parent theme, or a bare theme). */
  theme: "tokens/theme.json",
  appIconLight: "logos/app-icon/app-icon-light.svg",
  appIconDark: "logos/app-icon/app-icon-dark.svg",
  /** The Android adaptive foreground on a 108 x 108 canvas, art inside the central 66 x 66. */
  adaptiveForeground: "logos/app-icon/adaptive-foreground.svg",
  adaptiveMonochrome: "logos/app-icon/adaptive-monochrome.svg",
  favicon: "logos/favicon/favicon.svg",
  splashLight: "logos/splash/splash-light.svg",
  splashDark: "logos/splash/splash-dark.svg",
  /** Folder of TrueType or OpenType fonts used to set store captions. */
  fonts: "fonts",
} as const);
