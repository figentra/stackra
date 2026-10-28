/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/i18n (the native language switcher, `useLanguageSwitcher`
 *          and `<LanguageSwitcher />`, and the phone's languages and region, `deviceLanguageTags` and `deviceRegion`) until `stackra gen` writes the entry barrels (STA-339). The pure helpers a
 *          native app starts with (`startingLocale`, `regionFormat`, `nativeSwitcherMode`) are in the `.` entry.
 * Boundary: names each re-export and declares nothing. React Native, expo-localization, expo-updates,
 *           expo-intent-launcher and expo-constants are optional peers, loaded by this entry only.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); ADR 0080 (2026-10-29 note, STA-1534); the STA-347 stand-in barrel
 *                     decision.
 */
export { deviceLanguageTags } from "#native/functions/device-language-tags.function";
export { deviceRegion } from "#native/functions/device-region.function";
export { LanguageSwitcher } from "#native/language-switcher/language-switcher";
export type { LanguageSwitcherOptions } from "#native/language-switcher/language-switcher-options.type";
export type { LanguageSwitcherProps } from "#native/language-switcher/language-switcher-props.type";
export type { LanguageSwitcherState } from "#native/language-switcher/language-switcher-state.type";
export { useLanguageSwitcher } from "#native/language-switcher/use-language-switcher";
