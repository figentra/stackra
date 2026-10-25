/**
 * Stackra file contract:
 * Purpose: `THEMING_CONFIG_SCHEMA`, the zod schema this package ships for `ThemingConfig` (exported as
 *          `ThemingConfig$`): the theme by name, the logo source, the schemes on offer and the first one, the theme
 *          colour and splash background per scheme, self-hosted fonts and the tenant colour switch.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `ThemingConfig$` extends it field by field
 *           (`shape.theme.unwrap().default("acme")`). The defaults equal `ThemingOptions`' initializers (tested) and
 *           come from the `stackra` theme of `@stackra/tokens`. No object-level refinement, so `.extend(...)` stays
 *           possible; `ColorSchemeService` checks that `defaultScheme` is one of `schemes` when it is built.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0302 (decision 2); ADR 0234 (asset
 *                     keys).
 */
import { STACKRA_THEME } from "@stackra/tokens";
import { z } from "zod";

/** The schemes, in the order a toggle offers them; the values of `ColorScheme` (`@stackra/ui/contracts`). */
const SCHEMES = ["light", "dark", "system"] as const;

/** A theme name as `defineTheme` accepts it: kebab-case. */
const THEME_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** An asset key: `<module>::<kind>/<path>`. */
const ASSET_KEY = /^[^\s:]+::[^\s/]+\/\S+$/;

/** A colour the native splash and the web manifest can read: `#RRGGBB` or `#RRGGBBAA`. */
const HEX = z
  .string()
  .regex(/^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i, "a #RRGGBB or #RRGGBBAA hex colour");

/** One colour per resolved scheme. */
const SCHEME_COLORS = z.object({ light: HEX, dark: HEX });

/** The `stackra` theme's background, the default theme and splash colour. */
const background = (): z.output<typeof SCHEME_COLORS> => ({
  light: STACKRA_THEME.colors.background.hexLight,
  dark: STACKRA_THEME.colors.background.hexDark,
});

// shortcut: authored until gen compiles this package's ThemingOptions into #stackra/schemas; replace with STA-339.
/** The shipped `ThemingConfig$`. */
export const THEMING_CONFIG_SCHEMA = z.object({
  theme: z.string().regex(THEME_NAME, "a kebab-case theme name").default(STACKRA_THEME.name),
  logo: z
    .union([
      z.string().regex(ASSET_KEY, "an asset key <module>::<kind>/<path>"),
      z.object({
        key: z.string().regex(ASSET_KEY),
        file: z.string().min(1),
        overridable: z.boolean(),
      }),
    ])
    .nullable()
    .default(null),
  schemes: z
    .array(z.enum(SCHEMES))
    .min(1)
    .refine((schemes) => new Set(schemes).size === schemes.length, "each scheme once")
    .default(() => [...SCHEMES]),
  defaultScheme: z.enum(SCHEMES).default("system"),
  themeColor: SCHEME_COLORS.default(background),
  splash: z.object({ background: SCHEME_COLORS }).default(() => ({ background: background() })),
  selfHostedFonts: z.boolean().default(true),
  tenantOverride: z.boolean().default(false),
});
