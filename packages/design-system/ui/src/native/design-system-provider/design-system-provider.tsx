/**
 * Stackra file contract:
 * Purpose: the native `DesignSystemProvider` on HeroUI Native and Uniwind: switches the Uniwind theme
 *          (`Uniwind.setTheme`, which follows the system for `system`) and UIKit's interface style
 *          (`Appearance.setColorScheme`, so native headers, tab bar, Liquid Glass and status bar match), lays the
 *          subtree out in the locale's direction (a `flex: 1` View with Yoga `direction`, plus Uniwind's
 *          `LayoutDirection` for the `rtl:` and `ltr:` variants), and tells `HeroUINativeProvider` the direction
 *          through `config.isRTL`. It also gives Lucide icons the `md` size and the theme's foreground colour, which
 *          native hosts override.
 * Boundary: applies the scheme and direction to this subtree. Yoga content (screens and modals rendered below it
 *          included) inherits the direction; UIKit chrome does not: the app passes `useDesignSystem().direction` to
 *          NavigationContainer's `direction` and the native tabs' `layoutDirection`. The provider never calls
 *          `I18nManager.forceRTL`. The app wraps it in GestureHandlerRootView and SafeAreaProvider, as HeroUI Native
 *          requires.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 3); ADR 0165 (UI contract, HeroUI Native on native); ADR 0060 (RTL).
 */
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { LucideProvider } from "lucide-react-native";
import { useLayoutEffect, useMemo, useState } from "react";
import { Appearance, View } from "react-native";
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
  // Appearance sets UIKit's interface style, which native chrome follows; Uniwind only styles our views.
  useLayoutEffect(() => {
    Uniwind.setTheme(currentColorScheme);
    Appearance.setColorScheme(currentColorScheme === "system" ? "unspecified" : currentColorScheme);
  }, [currentColorScheme]);
  // On unmount only, so a scheme change does not flash through the device scheme. `unspecified` is the value before
  // mount: `Appearance.getColorScheme()` reports the resolved scheme, so reading it back would pin the device's.
  useLayoutEffect(() => () => Appearance.setColorScheme("unspecified"), []);

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
  // LayoutDirection's own View is `display: contents`, which Yoga skips, so its `direction` never reaches the layout.
  const layout = useMemo(() => ({ flex: 1, direction: currentDirection }), [currentDirection]);
  // Native has no `currentColor` cascade: without this default a bare icon would draw black in dark mode.
  const foreground = useThemeColor("foreground");

  return (
    <DesignSystemContext value={state}>
      <View style={layout}>
        <LayoutDirection rtl={isRtl}>
          <HeroUINativeProvider config={config}>
            <LucideProvider size={ICON_SIZES.md} color={foreground}>
              {children}
            </LucideProvider>
          </HeroUINativeProvider>
        </LayoutDirection>
      </View>
    </DesignSystemContext>
  );
}
