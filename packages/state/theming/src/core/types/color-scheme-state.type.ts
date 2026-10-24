/**
 * Stackra file contract:
 * Purpose: `ColorSchemeState`, what `useColorScheme()` returns: the scheme the user chose, the scheme it resolves to on
 *          screen, and the setter a toggle or a settings page calls.
 * Boundary: a type only. A value of it is a frozen snapshot that `ColorSchemeService` replaces on every change, so a
 *           render compares it by identity; `setScheme` is bound and stable, so it can be passed as a handler.
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (light and dark); ADR 0079 (client state); ADR 0294 (decision 8).
 */
import type { ColorScheme, ResolvedColorScheme } from "@stackra/ui/contracts";

/** The colour scheme as a component sees it. */
export interface ColorSchemeState {
  /** The chosen scheme; `system` follows the operating system. */
  readonly scheme: ColorScheme;

  /** The scheme on screen: `system` resolved to light or dark. */
  readonly resolved: ResolvedColorScheme;

  /**
   * Chooses `scheme` and keeps it on this device.
   *
   * @throws RangeError when `scheme` is not one of `ThemingConfig.schemes`.
   */
  readonly setScheme: (scheme: ColorScheme) => void;
}
