/**
 * Stackra file contract:
 * Purpose: the web `DesignSystemProvider` on HeroUI v3: puts the resolved colour scheme on the document element the
 *          way HeroUI v3 themes switch (`.dark` / `.light` and `data-theme`), follows `prefers-color-scheme` while the
 *          scheme is `system`, sets the material mode (`data-material`, solid unless asked), the brand family
 *          (`data-brand`, when one is picked), `lang` and `dir`, holds the picked theme transition, and wraps
 *          the app in React Aria's I18nProvider, which HeroUI v3
 *          components read their locale and direction from. React Aria derives the direction from the locale alone,
 *          so when `direction` overrides the locale's own, it is given the locale with a script of that direction. The
 *          React Aria locale also carries the digits setting of the nearest i18n provider (`useNumerals`) as its
 *          `-u-nu-` keyword, so the date, number and money fields and the date labels write the customer's digits.
 *          It holds the app-wide motion level (`motion`), lowered to `reduced` by `prefers-reduced-motion`, sets it
 *          on `<html data-motion>` for the theme's stylesheet, and hands it to Motion's `MotionConfig`, so every
 *          Motion animation below it drops its movement at `reduced` and `none`.
 * Boundary: applies the scheme and direction; the theme's and the brands' CSS are the app's (`@stackra/tokens/themes/*`,
 *           brand layers keyed on `data-brand`), and so is playing the transition (`useDesignSystem().transition`).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0060 (light, dark, RTL).
 */
import { intlLocale, NumberingSystem } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { MotionConfig } from "motion/react";
import { I18nProvider } from "react-aria-components";
import { useLayoutEffect, useMemo, useState, useSyncExternalStore, type ReactElement } from "react";

import type { ColorScheme } from "#contracts/enums/color-scheme.enum";
import type { Direction } from "#contracts/enums/direction.enum";
import type { MotionLevel } from "#contracts/enums/motion-level.enum";
import type { DesignSystemProviderProps } from "#contracts/types/design-system-provider-props.type";
import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { directionOf } from "#core/functions/direction-of.function";
import { resolveMotion } from "#core/functions/resolve-motion.function";

import { DesignSystemContext } from "./design-system-context";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const subscribeToSystemScheme = (onChange: () => void) => {
  const query = matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const isSystemDark = () => matchMedia(DARK_QUERY).matches;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

const subscribeToSystemMotion = (onChange: () => void) => {
  const query = matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const isSystemReduced = () => matchMedia(REDUCED_QUERY).matches;

/**
 * The locale React Aria is given: `locale` itself, or, when `direction` contradicts it, `locale` with a script of
 * that direction (`ar` read left to right is `ar-Latn`, `en` read right to left is `en-Arab`), so arrow keys and
 * placement follow the document's `dir`. Formatting keeps the language and region.
 */
const ariaLocaleOf = (locale: string, direction: Direction) => {
  if (directionOf(locale) === direction) return locale;
  try {
    return new Intl.Locale(locale, { script: direction === "rtl" ? "Arab" : "Latn" }).toString();
  } catch {
    return direction === "rtl" ? "ar" : "en";
  }
};

/**
 * Applies the Stackra Design System to a web app: colour scheme, locale, direction and brand family. Wrap the app once, inside
 * the router; read the state with `useDesignSystem()`.
 */
export function DesignSystemProvider({
  children,
  colorScheme,
  defaultColorScheme = "system",
  onColorSchemeChange,
  locale,
  defaultLocale = "en",
  onLocaleChange,
  brand,
  defaultBrand,
  onBrandChange,
  transition,
  defaultTransition = "none",
  onTransitionChange,
  motion,
  defaultMotion = "full",
  onMotionChange,
  direction,
  theme = "stackra",
  material = "solid",
}: DesignSystemProviderProps): ReactElement {
  const [ownColorScheme, setOwnColorScheme] = useState<ColorScheme>(defaultColorScheme);
  const [ownLocale, setOwnLocale] = useState(defaultLocale);
  const [ownBrand, setOwnBrand] = useState(defaultBrand);
  const [ownTransition, setOwnTransition] = useState(defaultTransition);
  const [ownMotion, setOwnMotion] = useState<MotionLevel>(defaultMotion);
  const currentMotion = motion ?? ownMotion;
  const systemReduced = useSyncExternalStore(subscribeToSystemMotion, isSystemReduced, () => false);
  const resolvedMotion = resolveMotion(currentMotion, systemReduced);
  const currentColorScheme = colorScheme ?? ownColorScheme;
  const currentLocale = locale ?? ownLocale;
  const currentBrand = brand ?? ownBrand;
  const currentTransition = transition ?? ownTransition;
  const systemDark = useSyncExternalStore(subscribeToSystemScheme, isSystemDark, () => false);
  const resolvedColorScheme =
    currentColorScheme === "system" ? (systemDark ? "dark" : "light") : currentColorScheme;
  const currentDirection = direction ?? directionOf(currentLocale);
  const numerals = useNumerals();
  const ariaLocale = ariaLocaleOf(currentLocale, currentDirection);

  // Layout effect: the attributes land before paint, so a switch never flashes the old scheme. The cleanup puts back
  // what the document had, so an unmounted provider leaves <html> as it found it.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const had = { dark: root.classList.contains("dark"), light: root.classList.contains("light") };
    const attributes = [
      "data-theme",
      "data-material",
      "data-motion",
      "data-brand",
      "lang",
      "dir",
    ].map((name) => [name, root.getAttribute(name)] as const);
    root.classList.toggle("dark", resolvedColorScheme === "dark");
    root.classList.toggle("light", resolvedColorScheme === "light");
    root.dataset["theme"] = resolvedColorScheme;
    root.dataset["material"] = material;
    root.dataset["motion"] = resolvedMotion;
    if (currentBrand === undefined) root.removeAttribute("data-brand");
    else root.dataset["brand"] = currentBrand;
    root.lang = currentLocale;
    root.dir = currentDirection;
    return () => {
      root.classList.toggle("dark", had.dark);
      root.classList.toggle("light", had.light);
      for (const [name, value] of attributes)
        if (value === null) root.removeAttribute(name);
        else root.setAttribute(name, value);
    };
  }, [
    resolvedColorScheme,
    material,
    resolvedMotion,
    currentBrand,
    currentLocale,
    currentDirection,
  ]);

  const state = useMemo<DesignSystemState>(
    () => ({
      colorScheme: currentColorScheme,
      resolvedColorScheme,
      locale: currentLocale,
      direction: currentDirection,
      theme,
      brand: currentBrand,
      transition: currentTransition,
      motion: currentMotion,
      resolvedMotion,
      setColorScheme: (next) => {
        setOwnColorScheme(next);
        onColorSchemeChange?.(next);
      },
      setLocale: (next) => {
        setOwnLocale(next);
        onLocaleChange?.(next);
      },
      setBrand: (next) => {
        setOwnBrand(next);
        onBrandChange?.(next);
      },
      setTransition: (next) => {
        setOwnTransition(next);
        onTransitionChange?.(next);
      },
      setMotion: (next) => {
        setOwnMotion(next);
        onMotionChange?.(next);
      },
    }),
    [
      currentColorScheme,
      resolvedColorScheme,
      currentLocale,
      currentDirection,
      theme,
      currentBrand,
      currentTransition,
      currentMotion,
      resolvedMotion,
      onColorSchemeChange,
      onLocaleChange,
      onBrandChange,
      onTransitionChange,
      onMotionChange,
    ],
  );

  return (
    <DesignSystemContext value={state}>
      <I18nProvider
        locale={numerals === NumberingSystem.User ? ariaLocale : intlLocale(ariaLocale, numerals)}
      >
        <MotionConfig reducedMotion={resolvedMotion === "full" ? "never" : "always"}>
          {children}
        </MotionConfig>
      </I18nProvider>
    </DesignSystemContext>
  );
}
