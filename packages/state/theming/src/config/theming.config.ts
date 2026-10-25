/**
 * Stackra file contract:
 * Purpose: `ThemingConfig`, a member's look (key `theming`): the theme by name, the logo source, the schemes, the
 *          theme colour, the splash, self-hosted fonts and the tenant colour switch.
 * Boundary: a configuration class over `ThemingOptions` with no env map. A host overrides it as
 *           `class ThemingConfig extends BaseThemingConfig` with `override` members only, inheriting the key. Gen reads
 *           it for the icons, manifests and splash it writes; the generated root mounts the design system provider
 *           with its theme and the `ColorSchemeService` scheme. Holds no secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0302; ADR 0281 (config files named by
 *                     topic).
 */
import { Config } from "@stackra/config";

import { ThemingOptions } from "#core/schemas/theming-options.schema";

/**
 * A member's look.
 *
 * @example
 * import { ColorScheme, ThemingConfig as BaseThemingConfig } from "@stackra/theming";
 *
 * export class ThemingConfig extends BaseThemingConfig {
 *   override theme = "acme";
 *   override logo = "mobile::public/logo.svg";
 *   override defaultScheme: ColorScheme = ColorScheme.System;
 *   override splash = { ...this.splash, background: { light: "#f7f7f5", dark: "#1c1e22" } };
 * }
 */
export class ThemingConfig extends Config({ schema: ThemingOptions }) {}
