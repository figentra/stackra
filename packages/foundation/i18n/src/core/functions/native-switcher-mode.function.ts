/**
 * Stackra file contract:
 * Purpose: `nativeSwitcherMode(configured, os, version)`, the switcher mode a native app runs: the configured one,
 *          except `system` falls back to `in_app` on Android below 13 (API 33), which has no per-app language screen.
 * Boundary: a pure function over React Native's `Platform.OS` and `Platform.Version`; the `./native` entry passes them.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534).
 */
import { NativeSwitcher } from "#core/enums/native-switcher.enum";

/** The first Android API level with a per-app language screen (Android 13). */
const ANDROID_PER_APP_LANGUAGE = 33;

/**
 * The switcher mode on this platform.
 *
 * @example
 * nativeSwitcherMode(NativeSwitcher.System, "android", 31); // "in_app"
 * nativeSwitcherMode(NativeSwitcher.System, "ios", "18.0"); // "system"
 */
export function nativeSwitcherMode(
  configured: NativeSwitcher,
  os: string,
  version: string | number,
): NativeSwitcher {
  return os === "android" && Number(version) < ANDROID_PER_APP_LANGUAGE
    ? NativeSwitcher.InApp
    : configured;
}
