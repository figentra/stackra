/**
 * Stackra file contract:
 * Purpose: the props both `DesignSystemProvider`s take, on web (`./react`) and native (`./native`): colour scheme,
 *          locale, direction, theme name, brand family, theme transition and (native) the text-scale cap. Scheme,
 *          locale, brand and transition follow the React convention: controlled with the value and its `on…Change`,
 *          or uncontrolled from `default…`.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0165 (UI contract).
 */
import type { ReactNode } from "react";

import type { ColorScheme } from "#contracts/enums/color-scheme.enum";
import type { Direction } from "#contracts/enums/direction.enum";
import type { MotionLevel } from "#contracts/enums/motion-level.enum";

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
  /**
   * The brand family drawn over the theme, an id the app's brand stylesheets know (`figentra`, `organza`, …),
   * controlled. On web it is set on `<html data-brand>`; the brand's own CSS is the app's. Leave it out to let the
   * provider hold it.
   */
  readonly brand?: string | undefined;
  /** The starting brand when uncontrolled. None by default: the theme alone. */
  readonly defaultBrand?: string | undefined;
  /** Called when `setBrand` picks a brand. */
  readonly onBrandChange?: ((brand: string) => void) | undefined;
  /**
   * The transition a scheme, locale, brand or material change plays, a preset id the app's runner knows
   * (`circle-origin`, `fade`, `none`, …), controlled. The provider holds it; the app plays it, and plays a fade or
   * nothing under reduced motion.
   */
  readonly transition?: string | undefined;
  /** The starting transition when uncontrolled. Defaults to `none`. */
  readonly defaultTransition?: string | undefined;
  /** Called when `setTransition` picks a transition. */
  readonly onTransitionChange?: ((transition: string) => void) | undefined;
  /**
   * The app-wide motion level, controlled: `full`, `reduced` (fades instead of movement) or `none`. The system's
   * reduce-motion setting lowers `full` to `reduced`. Read it resolved with `useMotion()`.
   */
  readonly motion?: MotionLevel | undefined;
  /** The starting motion level when uncontrolled. Defaults to `full`. */
  readonly defaultMotion?: MotionLevel | undefined;
  /** Called when `setMotion` picks a level. */
  readonly onMotionChange?: ((motion: MotionLevel) => void) | undefined;
  /** The text direction; derived from the locale when left out. */
  readonly direction?: Direction | undefined;
  /** The name of the theme whose stylesheet the app loads. Defaults to `stackra`. */
  readonly theme?: string | undefined;
  /**
   * The mode of the theme's glass material, a name its stylesheet knows (`solid`, `frosted`, `glass` or `liquid` for
   * the `@stackra/tokens` themes), set on `<html data-material>`. Defaults to `solid`: product UI is opaque, and a
   * showcase surface asks for glass (ADR 0320 decision 7). A page with no provider gets the stylesheet's own default.
   */
  readonly material?: string | undefined;
  /**
   * The largest text scale native text renders at, for dense screens (a till, a kitchen display); leave it out, or
   * pass `null`, to follow the device's Dynamic Type or font scale with no cap. Text always scales with the device
   * setting up to this cap, and there is no in-app text-size setting. Native only: the web follows the browser's
   * own zoom and text size.
   */
  readonly maxFontScale?: number | null | undefined;
}
