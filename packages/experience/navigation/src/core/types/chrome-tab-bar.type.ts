/**
 * Stackra file contract:
 * Purpose: `ChromeTabBar`, the native tab bar's behaviour (`ChromeConfig.tabBar`): shrink while content scrolls down,
 *          become a sidebar on iPad.
 * Boundary: a type only, mutable like the zod output it is checked against.
 * Runtime: isomorphic
 * Governing contract: ADR 0165 (react-native-bottom-tabs); ADR 0305 (rule 34).
 */

/** The native tab bar's behaviour. */
export interface ChromeTabBar {
  /** Shrinks the bar while content scrolls down (iOS 26). */
  minimizeOnScroll: boolean;

  /** Turns the bar into a sidebar on iPad. */
  sidebarAdaptable: boolean;
}
