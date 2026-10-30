/**
 * Stackra file contract:
 * Purpose: `loadClipboard()`, the `expo-clipboard` module when the app has it, else `null`.
 * Boundary: loaded on first use, never imported, so an app without the optional peer still runs; the CopyButton is
 *           then disabled. Never throws.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); design-system gap inventory row 35.
 */

/** The clipboard, or `null` where `expo-clipboard` is not installed. */
export function loadClipboard(): { setStringAsync: (text: string) => Promise<boolean> } | null {
  // Metro reports a lazy require that throws as fatal even inside try, so a dev client built without the native
  // module (the JS package resolves, `ExpoClipboard` is not linked) is checked first.
  const native = (globalThis as { expo?: { modules?: Record<string, unknown> } }).expo?.modules;
  if (!native?.["ExpoClipboard"]) return null;
  try {
    // oxlint-disable-next-line typescript/no-require-imports -- an optional peer, required on first use so an app without it still runs
    return require("expo-clipboard") as { setStringAsync: (text: string) => Promise<boolean> };
  } catch {
    return null;
  }
}
