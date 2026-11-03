/**
 * Stackra file contract:
 * Purpose: `CONFIG_DEFAULTS`, the base default of each package config field an emitter reads, keyed
 *          `<ConfigClass>.<field>`, taken when the host's override does not set the field (`configuredDefault`).
 * Boundary: data only; shared by `emitI18n` and `emitExpoConfig` so both fall back the same way.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 1: an override sets field defaults only); ADR 0294 (decision 26); STA-2065.
 */

/** The base default of each config field gen reads. */
// shortcut: mirrors the defaults of I18nOptions, IdentityOptions and AppIconOptions; read them from each package's
// manifest once it records config defaults.
export const CONFIG_DEFAULTS: Readonly<Record<string, unknown>> = {
  "I18nConfig.locales": ["en"],
  "I18nConfig.defaultLocale": "en",
  "I18nConfig.urlStrategy": "prefix_except_default",
  "I18nConfig.rtl": ["ar", "ar-SA", "ar-AE", "ar-EG"],
  "IdentityConfig.issuer": "",
  "AppIconConfig.icons": [],
};
