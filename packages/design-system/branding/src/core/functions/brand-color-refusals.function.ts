/**
 * Stackra file contract:
 * Purpose: `brandColorRefusals(colors)`, the contrast rules of the brand colours: the primary colour needs an on-colour
 *          (white or `#111111`) at 4.5:1 or more (WCAG 1.4.3, text), the accent 3:1 or more against white (WCAG
 *          1.4.11, non-text). One `BrandColorContrastError` per colour that falls short, naming its ratio and minimum.
 * Boundary: pure; returns the refusals and throws none, so the settings schema turns them into issues and a save path
 *           throws the first. An unset colour (`null`) passes. A value that is not `#RRGGBB` is the format rule's
 *           to refuse, so it is skipped here.
 * Runtime: isomorphic
 * Governing contract: WCAG 2.2 (1.4.3, 1.4.11); ADR 0140; STA-2644 (FR-001).
 */
import { contrastRatio } from "@stackra/tokens";

import type { BrandingSettings } from "#core/branding.settings";
import { BrandColorContrastError } from "#core/errors/brand-color-contrast.error";
import { onColor } from "#core/functions/on-color.function";

/** A `#RRGGBB` colour. */
const HEX = /^#[0-9A-Fa-f]{6}$/;

/** The surface the accent is drawn on. */
const WHITE = "#FFFFFF";

/** The ratio text on the primary colour's on-colour needs (WCAG AA, normal text). */
const PRIMARY_MINIMUM = 4.5;

/** The ratio the accent needs against white (WCAG non-text contrast). */
const ACCENT_MINIMUM = 3;

/** The refusal of the colour at `path` when `ratio` is below `minimum`, else nothing. */
function refusalOf(path: string, ratio: number, minimum: number): BrandColorContrastError[] {
  if (ratio >= minimum) return [];
  const floored = Math.floor(ratio * 100) / 100;
  return [
    BrandColorContrastError.create(
      { ratio: floored, minimum },
      { fieldErrors: { [path]: "brand_color_contrast" } },
    ),
  ];
}

/**
 * The refusals of `colors`, primary first; empty when both pass or are unset.
 *
 * @example
 * brandColorRefusals({ primaryColor: "#777777", accentColor: null })[0]?.details; // { ratio: 4.47, minimum: 4.5 }
 */
export function brandColorRefusals(
  colors: Pick<BrandingSettings, "primaryColor" | "accentColor">,
): BrandColorContrastError[] {
  const { primaryColor, accentColor } = colors;
  return [
    ...(primaryColor !== null && HEX.test(primaryColor)
      ? refusalOf(
          "primaryColor",
          contrastRatio(primaryColor, onColor(primaryColor)),
          PRIMARY_MINIMUM,
        )
      : []),
    ...(accentColor !== null && HEX.test(accentColor)
      ? refusalOf("accentColor", contrastRatio(accentColor, WHITE), ACCENT_MINIMUM)
      : []),
  ];
}
