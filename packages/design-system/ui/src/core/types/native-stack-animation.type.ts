/**
 * Stackra file contract:
 * Purpose: `NativeStackAnimation`, the native-stack screen animations `nativeStackAnimationOf` maps onto
 *          (`@react-navigation/native-stack`'s `animation` option).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0329 (motion layer).
 */

/** A native-stack screen animation. */
export type NativeStackAnimation =
  | "slide_from_right"
  | "slide_from_left"
  | "ios_from_right"
  | "ios_from_left"
  | "fade"
  | "none";
