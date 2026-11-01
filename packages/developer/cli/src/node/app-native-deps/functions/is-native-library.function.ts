/**
 * Stackra file contract:
 * Purpose: `isNativeLibrary(name)`, whether a dependency name is a native library Expo autolinks, by
 *          `NATIVE_PREFIXES` (moved from `tools/scripts/app-native-deps.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0117; STA-1544.
 */
import { NATIVE_PREFIXES } from "#node/app-native-deps/constants/native-prefixes.constant";

/**
 * True when `name` starts with one of the autolinked prefixes.
 *
 * @param name - a dependency name.
 * @example
 * isNativeLibrary("@shopify/react-native-skia"); // true
 */
export function isNativeLibrary(name: string): boolean {
  return NATIVE_PREFIXES.some((prefix) => name.startsWith(prefix));
}
