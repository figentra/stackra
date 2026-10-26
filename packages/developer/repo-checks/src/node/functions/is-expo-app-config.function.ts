/**
 * Stackra file contract:
 * Purpose: `isExpoAppConfig(path)`, whether a path is an Expo app config: an app member's or the app templates' `app.json`.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: STA-461.
 */

/**
 * True for an Expo app config.
 *
 * @param path - repository-relative.
 * @example
 * isExpoAppConfig("apps/mobile/app.json"); // true
 */
export function isExpoAppConfig(path: string): boolean {
  return /^(?:apps|tools\/scaffold\/templates\/apps)\/[^/]+\/app\.json$/.test(path);
}
