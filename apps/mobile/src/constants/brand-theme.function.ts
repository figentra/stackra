/**
 * Stackra file contract:
 * Purpose: `brandTheme`, a brand layer (a `stackra.theme-diff/2` from the brand repo's `brands/<id>/tokens/theme.json`)
 *          over the brand-neutral `STACKRA_THEME`, with the accent palette steps the layer leaves out derived from its
 *          accent.
 * Boundary: a pure function; it reads the layer with `parseThemeJson` like any studio import.
 * Runtime: react-native
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
 * The theme `layer` makes over the Stackra base. A layer that sets the accent but not its palette steps (hover,
 * pressed, soft) would keep the base's steel ones, so those are derived from the accent; the layer's own steps win.
 */
export function brandTheme(layer: {
  readonly name?: string;
  readonly changes: {
    readonly name?: string;
    readonly palette?: object;
    readonly colors?: Readonly<Record<string, unknown>>;
  };
}): Theme {
  const theme = parseThemeJson(JSON.stringify(layer), STACKRA_THEME);
  const own = new Set(Object.keys(layer.changes.palette ?? {}));
  // Each scheme's steps come from that scheme's accent; deriving both from the light one sank the dark hover.
  const { light, dark } = theme.colors.accent;
  const accent = deriveAccent(theme, { light, dark });
  const derived = { ...deriveStatusSteps(theme).palette, ...accent.palette };
  // The label on the accent is the brand's when its layer sets one, else whichever of ink or page contrasts most.
  const ownLabel = Boolean(layer.changes.colors?.["accent-foreground"]);
  return mergeTheme(theme, {
    // A brand layer names itself at the top; the diff's own name, when it has one, wins.
    name: layer.changes.name ?? layer.name ?? theme.name,
    palette: Object.fromEntries(Object.entries(derived).filter(([name]) => !own.has(name))),
    ...(ownLabel || !accent.colors?.["accent-foreground"]
      ? {}
      : { colors: { "accent-foreground": accent.colors["accent-foreground"] } }),
  });
}
