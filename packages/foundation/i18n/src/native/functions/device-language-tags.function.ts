/**
 * Stackra file contract:
 * Purpose: `deviceLanguageTags()`, the phone's preferred language tags, nearest first, read from expo-localization:
 *          what `startingLocale` takes as `deviceTags` (on iOS the list starts with the per-app language choice).
 * Boundary: the reader is a parameter so a test hands a fake in.
 * Runtime: react-native
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534), ADR 0478 (Expo libraries).
 */
import { getLocales } from "expo-localization";

/**
 * The phone's preferred language tags, nearest first.
 *
 * @example
 * startingLocale({ ...config, mode, deviceTags: deviceLanguageTags(), chosen: stored });
 */
export function deviceLanguageTags(readLocales: typeof getLocales = getLocales): string[] {
  return readLocales().map((locale) => locale.languageTag);
}
