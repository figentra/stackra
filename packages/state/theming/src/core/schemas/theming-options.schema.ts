/**
 * Stackra file contract:
 * Purpose: `ThemingOptions`, the shape of `ThemingConfig`: the look of a member. The theme by name (a `defineTheme`
 *          theme of `@stackra/tokens`), the one logo every icon derives from, the schemes on offer and the first one,
 *          the theme colour and splash background per scheme, self-hosted fonts and whether a tenant's colours may be
 *          layered over the theme.
 * Boundary: a shape class; it registers this package's own schema (`THEMING_CONFIG_SCHEMA`) for itself when the module
 *           loads. The defaults are the `stackra` theme, no logo, every scheme with `system` first, the theme's
 *           background as the theme and splash colour, self-hosted fonts and no tenant colours (per-tenant brand is
 *           Pro, ADR 0077). Nested values are interfaces, so an override assigns a plain object literal; those fields
 *           and the logo union are `@Field` hatches over the shipped schema. Defaults are constants for gen (ADR 0294
 *           decision 26): the theme name and `STACKRA_BACKGROUND`, which a test pins to the tokens' derived hex.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0302 (decision 2); ADR 0060; ADR 0234 (asset keys).
 */
import type { AssetEntry } from "@stackra/assets";
import type { ColorScheme } from "@stackra/ui/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { STACKRA_BACKGROUND } from "#core/constants/stackra-background.constant";
import { THEMING_CONFIG_SCHEMA } from "#core/constants/theming-config-schema.constant";
import type { SchemeColors } from "#core/types/scheme-colors.type";
import type { Splash } from "#core/types/splash.type";

/**
 * The look of a member.
 *
 * @example
 * export class ThemingConfig extends BaseThemingConfig {
 *   override theme = "acme";
 *   override schemes: ColorScheme[] = [ColorScheme.Light, ColorScheme.Dark, ColorScheme.System];
 * }
 */
export class ThemingOptions extends Schema {
  /** The one SVG every icon, the favicon and the splash image derive from, as an asset key or entry; none by default. */
  // reason: an asset key or an asset entry, a union no shape type states; the shipped schema checks both forms
  @Field(THEMING_CONFIG_SCHEMA.shape.logo.pipe(z.custom<string | AssetEntry | null>()))
  logo: string | AssetEntry | null = null;

  /** `<meta name="theme-color">`, the Android status bar and the adaptive icon background, per scheme. */
  // reason: SchemeColors is an interface so an override assigns a plain object; the shipped schema checks the hex
  @Field(THEMING_CONFIG_SCHEMA.shape.themeColor)
  themeColor: SchemeColors = STACKRA_BACKGROUND;

  /** The native splash screen; its image is derived from `logo`. */
  // reason: Splash is an interface so an override assigns a plain object; the shipped schema checks the hex
  @Field(THEMING_CONFIG_SCHEMA.shape.splash)
  splash: Splash = { background: STACKRA_BACKGROUND };

  /** The theme by name; its web CSS is the stylesheet's and its native CSS the Uniwind theme's. */
  theme = "stackra";

  /** The schemes a user may choose between, in the order a toggle cycles them. */
  schemes: ColorScheme[] = ["light", "dark", "system"];

  /** The scheme of a first visit or launch; `system` follows the operating system. */
  defaultScheme: ColorScheme = "system";

  /** Whether the theme's font files are self-hosted and preloaded (and precached offline) instead of platform fonts. */
  selfHostedFonts = true;

  /** Whether a resolved scope's colours are layered over the theme's. */
  scopeOverride = false;
}

registerSchemas([[ThemingOptions, THEMING_CONFIG_SCHEMA]]);
