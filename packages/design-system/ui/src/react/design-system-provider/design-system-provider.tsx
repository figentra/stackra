/**
 * Stackra file contract:
 * Purpose: the web `DesignSystemProvider` on HeroUI v3: puts the resolved colour scheme on the document element the
 *          way HeroUI v3 themes switch (`.dark` / `.light` and `data-theme`), follows `prefers-color-scheme` while the
 *          scheme is `system`, sets the material mode (`data-material`, solid unless asked), `lang` and `dir`, and wraps
 *          the app in React Aria's I18nProvider, which HeroUI v3
 *          components read their locale and direction from. React Aria derives the direction from the locale alone,
 *          so when `direction` overrides the locale's own, it is given the locale with a script of that direction.
 * Boundary: applies the scheme and direction; the theme's CSS is imported by the app (`@stackra/tokens/themes/*`).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0060 (light, dark, RTL).
 */
import { I18nProvider } from "react-aria-components";
import { useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";

import type { ColorScheme } from "#contracts/enums/color-scheme.enum";
import type { Direction } from "#contracts/enums/direction.enum";
import type { DesignSystemProviderProps } from "#contracts/types/design-system-provider-props.type";
import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { directionOf } from "#core/functions/direction-of.function";

import { DesignSystemContext } from "./design-system-context";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const subscribeToSystemScheme = (onChange: () => void) => {
  const query = matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const isSystemDark = () => matchMedia(DARK_QUERY).matches;

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
 * Applies the Stackra Design System to a web app: colour scheme, locale and direction. Wrap the app once, inside
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
  direction,
  theme = "stackra",
  material = "solid",
}: DesignSystemProviderProps) {
  const [ownColorScheme, setOwnColorScheme] = useState<ColorScheme>(defaultColorScheme);
  const [ownLocale, setOwnLocale] = useState(defaultLocale);
  const currentColorScheme = colorScheme ?? ownColorScheme;
  const currentLocale = locale ?? ownLocale;
  const systemDark = useSyncExternalStore(subscribeToSystemScheme, isSystemDark, () => false);
  const resolvedColorScheme =
    currentColorScheme === "system" ? (systemDark ? "dark" : "light") : currentColorScheme;
  const currentDirection = direction ?? directionOf(currentLocale);

  // Layout effect: the attributes land before paint, so a switch never flashes the old scheme. The cleanup puts back
  // what the document had, so an unmounted provider leaves <html> as it found it.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const had = { dark: root.classList.contains("dark"), light: root.classList.contains("light") };
    const attributes = ["data-theme", "data-material", "lang", "dir"].map(
      (name) => [name, root.getAttribute(name)] as const,
    );
    root.classList.toggle("dark", resolvedColorScheme === "dark");
    root.classList.toggle("light", resolvedColorScheme === "light");
    root.dataset["theme"] = resolvedColorScheme;
    root.dataset["material"] = material;
    root.lang = currentLocale;
    root.dir = currentDirection;
    return () => {
      root.classList.toggle("dark", had.dark);
      root.classList.toggle("light", had.light);
      for (const [name, value] of attributes)
        if (value === null) root.removeAttribute(name);
        else root.setAttribute(name, value);
    };
  }, [resolvedColorScheme, material, currentLocale, currentDirection]);

  const state = useMemo<DesignSystemState>(
    () => ({
      colorScheme: currentColorScheme,
      resolvedColorScheme,
      locale: currentLocale,
      direction: currentDirection,
      theme,
      setColorScheme: (next) => {
        setOwnColorScheme(next);
        onColorSchemeChange?.(next);
      },
      setLocale: (next) => {
        setOwnLocale(next);
        onLocaleChange?.(next);
      },
    }),
    [
      currentColorScheme,
      resolvedColorScheme,
      currentLocale,
      currentDirection,
      theme,
      onColorSchemeChange,
      onLocaleChange,
    ],
  );

  return (
    <DesignSystemContext value={state}>
      <I18nProvider locale={ariaLocaleOf(currentLocale, currentDirection)}>{children}</I18nProvider>
    </DesignSystemContext>
  );
}
