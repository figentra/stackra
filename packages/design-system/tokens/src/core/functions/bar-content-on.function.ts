/**
 * Stackra file contract:
 * Purpose: `barContentOn(colour)`, the bar content that reads on a colour: `light` (white clock, icons and title) on a
 *          dark colour, `dark` on a light one, whichever of white and black has the higher WCAG contrast against it.
 *          The status bar and the navigation header take it from the theme's background, so a light-yellow brand in
 *          the dark scheme or a dark-pink one in the light scheme still gets readable content, not the scheme's guess.
 * Boundary: pure. Reads `#RGB`, `#RRGGBB`, `#RRGGBBAA`, `rgb()`/`rgba()` and `oklch()` (the forms themes and Uniwind
 *           hand back); the alpha is ignored (the colour as if opaque). A colour it cannot read gives `fallback`.
 * Runtime: isomorphic
 * Governing contract: owner decision 2026-10-28 (the status bar and the top bar follow the theme); WCAG 2.2 (relative
 *                     luminance); ADR 0320.
 */
import type { BarContent } from "#contracts/enums/bar-content.enum";
import { colourChannels } from "#core/functions/colour-channels.function";

/**
 * The bar content that reads on `colour`.
 *
 * @example
 * barContentOn("#F9F7EE"); // "dark": a light-yellow background
 * barContentOn("oklch(0.32 0.12 350)"); // "light": a dark pink one
 */
export function barContentOn(colour: string, fallback: BarContent = "dark"): BarContent {
  const channels = colourChannels(colour);
  if (channels === undefined || channels.some((channel) => !Number.isFinite(channel)))
    return fallback;
  const [red, green, blue] = channels.map((channel) => {
    const unit = Math.min(255, Math.max(0, channel)) / 255;
    return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  // White's contrast (1.05 / (L + 0.05)) beats black's ((L + 0.05) / 0.05) below L ≈ 0.179.
  return 1.05 / (luminance + 0.05) > (luminance + 0.05) / 0.05 ? "light" : "dark";
}
