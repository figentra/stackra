/**
 * Stackra file contract:
 * Purpose: `loadVideo()`, the `expo-video` module when the app has it, else `null`.
 * Boundary: loaded on first use, never imported, so an app without the optional peer still runs; the MediaPlayer then
 *           shows its name and no controls. Never throws.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371 (owner approval 2026-10-30).
 */
import type * as ExpoVideo from "expo-video";

/** The video module, or `null` where `expo-video` is not installed or not linked. */
export function loadVideo(): typeof ExpoVideo | null {
  // Metro reports a lazy require that throws as fatal even inside try, so a dev client built without the native
  // module (the JS package resolves, `ExpoVideo` is not linked) is checked first.
  const native = (globalThis as { expo?: { modules?: Record<string, unknown> } }).expo?.modules;
  if (!native?.["ExpoVideo"]) return null;
  try {
    // oxlint-disable-next-line typescript/no-require-imports -- an optional peer, required on first use so an app without it still runs
    return require("expo-video") as typeof ExpoVideo;
  } catch {
    return null;
  }
}
