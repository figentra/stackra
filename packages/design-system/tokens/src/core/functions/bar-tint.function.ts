/**
 * Stackra file contract:
 * Purpose: `barTint(background, share)`, a bar's glass tint on native: the theme's own background at `share` opacity
 *          as `#RRGGBBAA`, the colour React Native and a navigation header's appearance read (they read no oklch and
 *          no `color-mix`). The web's `.material-bar` is the same rule in CSS.
 * Boundary: pure. A colour it cannot read is returned as given (opaque), so a bar is never see-through by accident.
 * Runtime: isomorphic
 * Governing contract: owner decision 2026-10-28 (the bars follow the theme: the background at 85 to 92% with a blur).
 */
import { colourChannels } from "#core/functions/colour-channels.function";

/** Two hex digits of a 0 to 255 channel. */
const hexOf = (channel: number) =>
  Math.round(Math.min(255, Math.max(0, channel)))
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();

/**
 * `background` at `share` opacity.
 *
 * @example
 * barTint("#F9F7EE", 0.88); // "#F9F7EEE0"
 */
export function barTint(background: string, share: number): string {
  const channels = colourChannels(background);
  if (channels === undefined) return background;
  return `#${channels.map(hexOf).join("")}${hexOf(Math.min(1, Math.max(0, share)) * 255)}`;
}
