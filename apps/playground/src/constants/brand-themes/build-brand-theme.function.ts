/**
 * Stackra file contract:
 * Purpose: `buildBrandTheme`: the theme a brand layer (`stackra.theme-diff/2`) makes over `STACKRA_THEME`, with the
 *          accent's palette steps derived from the layer's accent.
 * Boundary: pure; the layer is a vendored copy of the brand repo's `tokens/theme.json`, read by `parseThemeJson` like
 *           any studio import.
 * Runtime: browser
 * Governing contract: ADR 0340 (decisions 2, 8 and 11: a brand is a layer above Stackra, never in @stackra/tokens).
 */
import {
  deriveAccent,
  deriveStatusSteps,
  mergeTheme,
  parseThemeJson,
  STACKRA_THEME,
} from "@stackra/tokens";
import type { Theme } from "@stackra/tokens/contracts";

/**
 * The theme `layer` makes over the Stackra base. A layer sets the accent roles but not the accent's palette steps
 * (hover, pressed, soft), which would keep the base's steel, so they are derived from its accent; the steps and
 * roles the layer sets itself (labels on the accent, focus, links) stay as written.
 *
 * @param layer a brand's `tokens/theme.json`
 * @throws InvalidThemeError when the layer is not a usable theme
 */
export function buildBrandTheme(layer: unknown): Theme {
  const theme = parseThemeJson(JSON.stringify(layer), STACKRA_THEME);
  const { name: layerName, changes } = layer as {
    name?: string;
    changes?: { name?: string; palette?: object; colors?: Record<string, unknown> };
  };
  const own = new Set(Object.keys(changes?.palette ?? {}));
  // Each scheme's steps come from that scheme's accent; deriving both from the light one sank the dark hover.
  const { light, dark } = theme.colors.accent;
  const accent = deriveAccent(theme, { light, dark });
  const derived = { ...deriveStatusSteps(theme).palette, ...accent.palette };
  // The label on the accent is the brand's when its layer sets one, else whichever of ink or page contrasts most.
  const ownLabel = Boolean(changes?.colors?.["accent-foreground"]);
  return mergeTheme(theme, {
    // A brand layer names itself at the top; the diff's own name, when it has one, wins.
    name: changes?.name ?? layerName ?? theme.name,
    palette: Object.fromEntries(Object.entries(derived).filter(([name]) => !own.has(name))),
    ...(ownLabel || !accent.colors?.["accent-foreground"]
      ? {}
      : { colors: { "accent-foreground": accent.colors["accent-foreground"] } }),
  });
}
