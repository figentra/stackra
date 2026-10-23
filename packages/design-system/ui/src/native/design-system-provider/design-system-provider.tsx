/**
 * Stackra file contract:
 * Purpose: the native `DesignSystemProvider` on HeroUI Native and Uniwind: switches the Uniwind theme
 *          (`Uniwind.setTheme`, which follows the system for `system`), scopes the subtree's layout direction with
 *          Uniwind's `LayoutDirection`, and tells `HeroUINativeProvider` the direction through `config.isRTL`. It also
 *          gives Lucide icons the `md` size and the theme's foreground colour, which native hosts override.
 * Boundary: applies the scheme and direction to this subtree. App-wide native RTL (navigation, system views) follows
 *          React Native's I18nManager, which changes only through `I18nManager.forceRTL` and an app restart; the
 *          provider never forces it. The app wraps it in GestureHandlerRootView and SafeAreaProvider, as HeroUI
 *          Native requires.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 3); ADR 0165 (UI contract, HeroUI Native on native); ADR 0060 (RTL).
 */
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { LucideProvider } from "lucide-react-native";
import { useLayoutEffect, useMemo, useState } from "react";
import { LayoutDirection, Uniwind, useUniwind } from "uniwind";

import type { ColorScheme } from "#contracts/enums/color-scheme.enum";
import type { DesignSystemProviderProps } from "#contracts/types/design-system-provider-props.type";
import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { directionOf } from "#core/functions/direction-of.function";

import { DesignSystemContext } from "./design-system-context";

/**
 * Applies the Stackra Design System to a native app: colour scheme, locale and direction. Wrap the app once,
 * inside GestureHandlerRootView and SafeAreaProvider; read the state with `useDesignSystem()`.
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
}: DesignSystemProviderProps) {
  const [ownColorScheme, setOwnColorScheme] = useState<ColorScheme>(defaultColorScheme);
  const [ownLocale, setOwnLocale] = useState(defaultLocale);
  const currentColorScheme = colorScheme ?? ownColorScheme;
  const currentLocale = locale ?? ownLocale;
  const currentDirection = direction ?? directionOf(currentLocale);
  const isRtl = currentDirection === "rtl";

  // Layout effect: on the New Architecture (the only one Expo 57 runs) it runs before the frame is shown, and the
  // re-render Uniwind's listeners ask for lands in the same frame, so the first paint is already in the scheme.
  // Not during render: setTheme notifies every useUniwind subscriber, which would update other components mid-render.
  useLayoutEffect(() => {
    Uniwind.setTheme(currentColorScheme);
  }, [currentColorScheme]);

  // Uniwind reports the theme on screen, `system` already resolved; it re-renders this hook on every change.
  const resolvedColorScheme = useUniwind().theme === "dark" ? "dark" : "light";

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
  const config = useMemo(() => ({ isRTL: isRtl }), [isRtl]);
  // Native has no `currentColor` cascade: without this default a bare icon would draw black in dark mode.
  const foreground = useThemeColor("foreground");

  return (
    <DesignSystemContext value={state}>
      <LayoutDirection rtl={isRtl}>
        <HeroUINativeProvider config={config}>
          <LucideProvider size={ICON_SIZES.md} color={foreground}>
            {children}
          </LucideProvider>
        </HeroUINativeProvider>
      </LayoutDirection>
    </DesignSystemContext>
  );
}
