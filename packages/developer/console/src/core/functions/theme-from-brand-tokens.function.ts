/**
 * Stackra file contract:
 * Purpose: `themeFromBrandTokens(tokens, choice)`, a `ConsoleTheme` whose colours come from a brand kit's DTCG
 *          `tokens/color.json`, so `runway`, `figentra` or a customer CLI follow their brand without this package
 *          depending on a brand package.
 * Boundary: pure; the caller reads the JSON file (the brand package it already pulls).
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-017.
 */
import type { ConsoleTheme } from "#contracts/types/console-theme.type";
import type { BrandColourTokens } from "#core/types/brand-colour-tokens.type";
import type { BrandThemeChoice } from "#core/types/brand-theme-choice.type";

/** A colour in `#rrggbb` form. */
const HEX = /^#[0-9a-f]{6}$/i;

/**
 * The theme `choice` describes, with its colours read from `tokens`.
 *
 * @throws RangeError when a named token is missing or is not `#rrggbb`.
 * @example
 * themeFromBrandTokens(colorJson, { name: "Runway", logo, glyph: "▲", asciiGlyph: "^",
 *   gradient: ["sky-500", "sky-200"], accent: "sky-500" });
 */
export function themeFromBrandTokens(
  tokens: BrandColourTokens,
  choice: BrandThemeChoice,
): ConsoleTheme {
  const colour = (name: string) => {
    const value = tokens.palette[name]?.$value;
    if (value === undefined || !HEX.test(value))
      throw new RangeError(`The brand palette has no #rrggbb colour named "${name}"`);
    return value;
  };
  return Object.freeze({
    name: choice.name,
    logo: Object.freeze([...choice.logo]),
    gradient: Object.freeze(choice.gradient.map(colour)),
    accent: colour(choice.accent),
    ...(choice.dark === undefined
      ? {}
      : {
          dark: Object.freeze({
            gradient: Object.freeze(choice.dark.gradient.map(colour)),
            accent: colour(choice.dark.accent),
          }),
        }),
    glyph: choice.glyph,
    asciiGlyph: choice.asciiGlyph,
  });
}
