/**
 * Stackra file contract:
 * Purpose: `I18nConfig`, the i18n configuration every member overrides in its own `src/config/i18n.config.ts`: the
 *          locales and their fallback chains, the right-to-left set, the digits and the URL strategy. Gen reads it
 *          for the `#stackra/i18n` loaders, the per-locale route mounts and the RTL test projects; the runtime reads
 *          it through the container (`ctx.config(I18nConfig)`, `useConfig(I18nConfig)`).
 * Boundary: a configuration class: the options are `I18nOptions`, the key is derived (`i18n`), and no field reads the
 *           environment. A member's override keeps the name, imports this class as `BaseI18nConfig` and sets
 *           `override` field defaults only, restating enum-typed fields. Loading this module registers the shipped
 *           schema with its cross-field rules, so `buildConfig` validates the class and every override.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 19; as amended by programming model v3.1: the Base alias), ADR 0146 as
 *                     amended, ADR 0080, ADR 0192, ADR 0297 (decision 4).
 */
import { Config } from "@stackra/config";
import { registerSchemas } from "@stackra/validation";

import { I18nConfig$ } from "#core/constants/i18n-config-schema.constant";
import { checkI18nOptions } from "#core/functions/check-i18n-options.function";
import { I18nOptions } from "#core/schemas/i18n-options.schema";

// shortcut: registered here until gen writes the package's #stackra/schemas registration (registry gap G1, STA-339).
// The cross-field rules join here, not on I18nConfig$, so gen's `I18nConfig$.extend(...)` overrides still load.
registerSchemas([[I18nOptions, I18nConfig$.superRefine(checkI18nOptions)]]);

/**
 * The i18n configuration.
 *
 * @example
 * // src/config/i18n.config.ts of a member
 * import { I18nConfig as BaseI18nConfig, Locale } from "@stackra/i18n";
 *
 * export class I18nConfig extends BaseI18nConfig {
 *   override locales: Locale[] = [Locale.En, Locale.EnUs, Locale.Ar, Locale.ArSa];
 *   override fallbacks: Record<string, Locale[]> = { "ar-SA": [Locale.Ar, Locale.En], ar: [Locale.En] };
 * }
 */
export class I18nConfig extends Config({ schema: I18nOptions }) {}
