/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/settings (`useSetting` with the `SettingState` it
 *          returns, and the web `SettingsForm` of a generated settings page) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. It imports the core through `#core/index`. `useSetting` serves
 *           React DOM and React Native alike; the form is the web one, its native twin is in `./native`.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); ADR 0504 (module UI kits); the STA-347 stand-in barrel decision.
 */
export type { SettingState } from "#react/setting/setting-state.type";
export { useSetting } from "#react/setting/use-setting";
export { SettingsForm } from "#react/settings-form/settings-form";
export type { SettingsFormProps } from "#react/settings-form/settings-form.props";
