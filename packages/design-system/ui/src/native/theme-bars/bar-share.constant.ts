/**
 * Stackra file contract:
 * Purpose: `BAR_SHARE`, the share of the theme's background in a native bar's glass, the native twin of the web's
 *          `.material-bar` (@stackra/tokens): whatever scrolls under the bar shows only as a blurred tenth.
 * Boundary: data only.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (the bars follow the theme: the background at 85 to 92%).
 */

/** The background's share of a bar's glass. */
export const BAR_SHARE = 0.88;
