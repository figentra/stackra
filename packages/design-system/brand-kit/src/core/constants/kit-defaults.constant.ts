/**
 * Stackra file contract:
 * Purpose: `KIT_DEFAULTS`, the value of every optional kit field a `kit.json` leaves out: which theme roles colour the
 *          icons, splash screens and store frames, the symbol's share of each canvas, the sizes, the manifest's mode,
 *          the store frame sizes and the files every kit must hold.
 * Boundary: data only; a kit overrides any field in its own `kit.json` (configuration, not code). Colours are role
 *           names, never values: the theme file holds the colours.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decisions 4, 5 and 7); the configuration-not-code rule.
 */
import type { BrandKit } from "#contracts/types/brand-kit.type";

/** Every default, in the shape of the kit's optional blocks. */
export const KIT_DEFAULTS: Pick<BrandKit, "icon" | "splash" | "manifest" | "store" | "check"> = {
  icon: {
    background: "accent",
    foreground: "accent-foreground",
    scale: 0.58,
    radius: 0.21875,
    sizes: [1024],
  },
  splash: { background: "background", foreground: "accent", scale: 0.6, size: 1024 },
  manifest: { display: "standalone", startUrl: "/" },
  store: {
    background: "accent",
    foreground: "accent-foreground",
    captionSize: 0.06,
    // Apple's required 6.9-inch portrait size and a common Android phone size.
    frames: [
      { id: "ios-6.9", width: 1320, height: 2868 },
      { id: "android-phone", width: 1080, height: 1920 },
    ],
    fonts: {},
  },
  check: { requiredFiles: ["kit.json", "README.md"], requiredMarks: [] },
};
