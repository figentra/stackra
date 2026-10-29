/**
 * Stackra file contract:
 * Purpose: `SpotlightNativeItem`, one entry as the `StackraSpotlight` Expo module takes it.
 * Boundary: a type only. `details` is the item's description, since a Swift record cannot have a `description`
 *           field; `keywords` is used on iOS only.
 * Runtime: react-native
 * Governing contract: ADR 0478 (decision 5: the module stays a pass-through).
 */

/** One entry as the native module takes it. */
export interface SpotlightNativeItem {
  /** The deep link and identity. */
  url: string;
  /** The record kind (the iOS domain identifier). */
  kind: string;
  /** The result's title. */
  title: string;
  /** The result's second line, or null. */
  details: string | null;
  /** Extra words the result is found by (iOS only). */
  keywords: string[];
}
