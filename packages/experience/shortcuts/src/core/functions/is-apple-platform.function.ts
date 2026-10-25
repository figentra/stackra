/**
 * Stackra file contract:
 * Purpose: `isApplePlatform`, whether the running browser is on a Mac, iPhone or iPad, where `mod` is Command.
 * Boundary: reads `navigator` only (User-Agent Client Hints first, then `navigator.platform`); `false` where there is
 *           no navigator (a server render, Node), matching the key hint's server snapshot.
 * Runtime: isomorphic
 * Governing contract: the template's shortcuts README (⌘ on Apple devices, Ctrl elsewhere).
 */

/** The navigator fields read; `userAgentData` is not in every DOM lib yet. */
type PlatformNavigator = {
  readonly platform?: string;
  readonly userAgentData?: { readonly platform?: string };
};

/**
 * Whether `mod` means Command here.
 *
 * @example
 * isApplePlatform(); // true in Safari on macOS
 */
export function isApplePlatform(): boolean {
  const navigator = (globalThis as { navigator?: PlatformNavigator }).navigator;
  const platform = navigator?.userAgentData?.platform ?? navigator?.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}
