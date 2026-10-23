/**
 * Stackra file contract:
 * Purpose: the props both `DesignSystemProvider`s take, on web (`./react`) and native (`./native`): colour scheme,
 *          locale, direction and theme name. Scheme and locale follow the React convention: controlled with
 *          `colorScheme` / `locale` and their `on…Change`, or uncontrolled from `default…`.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0165 (UI contract).
 */
import type { ReactNode } from "react";

import type { ColorScheme } from "#contracts/enums/color-scheme.enum";
import type { Direction } from "#contracts/enums/direction.enum";

/** Props of the web and native `DesignSystemProvider`. */
export interface DesignSystemProviderProps {
  /** The app the provider wraps. */
  readonly children?: ReactNode;
  /** The colour scheme, controlled; leave it out to let the provider hold it. */
  readonly colorScheme?: ColorScheme | undefined;
  /** The starting colour scheme when uncontrolled. Defaults to `system`. */
  readonly defaultColorScheme?: ColorScheme | undefined;
  /** Called when `setColorScheme` picks a scheme. */
  readonly onColorSchemeChange?: ((colorScheme: ColorScheme) => void) | undefined;
  /** The BCP 47 locale, controlled, for example `en` or `ar-EG`. */
  readonly locale?: string | undefined;
  /** The starting locale when uncontrolled. Defaults to `en`. */
  readonly defaultLocale?: string | undefined;
  /** Called when `setLocale` picks a locale. */
  readonly onLocaleChange?: ((locale: string) => void) | undefined;
  /** The text direction; derived from the locale when left out. */
  readonly direction?: Direction | undefined;
  /** The name of the theme whose stylesheet the app loads. Defaults to `stackra`. */
  readonly theme?: string | undefined;
}
