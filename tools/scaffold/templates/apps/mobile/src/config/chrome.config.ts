/**
 * Stackra file contract:
 * Purpose: the native chrome of @figentra/{{NAME}}: the status bar and the tab bar. The shell reads it while the app
 *          runs, and gen copies the start values into the Expo config (ADR 0295 decision 11).
 * Boundary: values only; colours come from the brand theme, never literals.
 * Runtime: react-native
 * Governing contract: ADR 0295 (decisions 4 and 11); ADR 0294 (decision 14).
 */
import type { StatusBarStyle } from "expo-status-bar";

/** The native chrome of the {{NAME}} app; a route may override it for its own screen. */
// shortcut: no base class until @stackra/app ships ChromeConfig and its enums (STA-339); then
// `extends ChromeConfig` with `override` fields and `StatusBarStyle.Auto`.
export class {{PASCAL}}ChromeConfig {
  /** The status bar; `auto` follows the colour scheme. */
  statusBar: { style: StatusBarStyle } = { style: "auto" };

  /** The tab bar; on iPad it can turn into a sidebar. */
  tabBar: { sidebarAdaptable: boolean } = { sidebarAdaptable: true };
}
