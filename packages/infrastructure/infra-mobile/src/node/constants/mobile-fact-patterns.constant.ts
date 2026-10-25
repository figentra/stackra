/**
 * Stackra file contract:
 * Purpose: `MOBILE_FACT_PATTERNS`, the shape of each mobile release fact once resolved, keyed by its provider path:
 *          the Expo account name, the EAS project id, the Apple team id, the App Store Connect app's Apple ID, the
 *          Play developer account id and the Play app-signing certificate fingerprint.
 * Boundary: internal; `mobileStack` checks every resolved fact against its pattern, so a value pasted into the wrong
 *           stack config key fails `pulumi preview` instead of an EAS build.
 * Runtime: node
 * Governing contract: ADR 0325 (rule 1: a deploy checks its inputs before it starts), ADR 0171 (decision 4).
 */

/** One pattern per fact the plan carries. */
export const MOBILE_FACT_PATTERNS = {
  /** An Expo account name. */
  "expo.account": /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
  /** An EAS project id, a UUID. */
  "expo.projectId": /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  /** An Apple developer team id: ten upper-case letters and digits. */
  "apple.teamId": /^[A-Z0-9]{10}$/,
  /** The App Store Connect app's Apple ID, digits only. */
  "apple.ascAppId": /^[0-9]+$/,
  /** The Play Console developer account id, digits only. */
  "google.playDeveloperId": /^[0-9]+$/,
  /** A SHA-256 certificate fingerprint as Play and `assetlinks.json` show it: 32 colon-separated hex pairs. */
  "google.appSigningSha256": /^[0-9A-F]{2}(?::[0-9A-F]{2}){31}$/i,
} as const satisfies Readonly<Record<string, RegExp>>;
