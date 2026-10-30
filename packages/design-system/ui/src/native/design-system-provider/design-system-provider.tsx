/**
 * Stackra file contract:
 * Purpose: the native `DesignSystemProvider` on HeroUI Native and Uniwind: switches the Uniwind theme
 *          (`Uniwind.setTheme`, which follows the system for `system`) and UIKit's interface style
 *          (`Appearance.setColorScheme`, so native headers, tab bar, Liquid Glass and status bar match), lays the
 *          subtree out in the locale's direction (a `flex: 1` View with Yoga `direction`, plus Uniwind's
 *          `LayoutDirection` for the `rtl:` and `ltr:` variants), and tells `HeroUINativeProvider` the direction
 *          through `config.isRTL`. Text and text inputs scale with the device's text size (Dynamic Type, Android font
 *          scale), capped by `maxFontScale` when an app sets one. It also gives Lucide icons the `md` size and the
 *          theme's foreground colour, which native hosts override. A scheme change after mount draws the Uniwind Pro
 *          transition `schemeTransition` returns (a native-only prop; none when it is left out). It holds the picked
 *          brand family and transition preset (the app's ids, shared with web through `useDesignSystem()`) and turns
 *          `haptics` on or off for every control when given (native-only; the switch is on by default). It holds the
 *          app-wide motion level (`motion`), lowered to `reduced` by the system's reduce-motion setting: below `full`
 *          Reanimated's `ReducedMotionConfig` turns every layout animation's movement off, and at `none` HeroUI
 *          Native's own animations are disabled too.
 * Boundary: applies the scheme and direction to this subtree. Yoga content (screens and modals rendered below it
 *          included) inherits the direction; UIKit chrome does not: the app passes `useDesignSystem().direction` to
 *          NavigationContainer's `direction` and the native tabs' `layoutDirection`. The provider never calls
 *          `I18nManager.forceRTL`. The app wraps it in GestureHandlerRootView and SafeAreaProvider, as HeroUI Native
 *          requires.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, 2026-10-29 note); ADR 0303 (decision 3); ADR 0165 (UI contract, HeroUI Native on native); ADR 0060 (RTL).
 */
import { HeroUINativeProvider, useThemeColor } from "heroui-native";
import { LucideProvider } from "lucide-react-native";
import { useLayoutEffect, useMemo, useRef, type ReactElement } from "react";
import { Appearance, View } from "react-native";
import { ReducedMotionConfig, ReduceMotion, useReducedMotion } from "react-native-reanimated";
import { LayoutDirection, Uniwind, useUniwind } from "uniwind";

import type { ColorScheme } from "#contracts/enums/color-scheme.enum";
import type { DesignSystemProviderProps } from "#contracts/types/design-system-provider-props.type";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { useDesignSystemState } from "#react/hooks/use-design-system-state";

import { haptics as hapticsSwitch } from "#native/haptics/haptics";

import { DesignSystemContext } from "./design-system-context";

/**
 * Applies the Stackra Design System to a native app: colour scheme, locale and direction. Wrap the app once,
 * inside GestureHandlerRootView and SafeAreaProvider; read the state with `useDesignSystem()`.
 */
export function DesignSystemProvider({
  children,
  maxFontScale = null,
  schemeTransition,
  haptics,
  ...props
}: DesignSystemProviderProps & {
  /** The transition a scheme change after mount draws, read at the change (Uniwind Pro); none when left out. */
  readonly schemeTransition?: (() => object | undefined) | undefined;
  /** Whether controls play touch feedback (`useHaptic()`); left out, the switch keeps its state (on by default). */
  readonly haptics?: boolean | undefined;
}): ReactElement {
  const isSystemReduced = useReducedMotion();
  // Uniwind reports the theme on screen, `system` already resolved; it re-renders this hook on every change.
  const resolvedColorScheme = useUniwind().theme === "dark" ? "dark" : "light";
  const state = useDesignSystemState(props, {
    isSystemReduced,
    resolveColorScheme: () => resolvedColorScheme,
  });
  const { colorScheme: currentColorScheme, resolvedMotion, direction: currentDirection } = state;
  const isRtl = currentDirection === "rtl";

  // Layout effect: on the New Architecture (the only one Expo 57 runs) it runs before the frame is shown, and the
  // re-render Uniwind's listeners ask for lands in the same frame, so the first paint is already in the scheme.
  // Not during render: setTheme notifies every useUniwind subscriber, which would update other components mid-render.
  // Appearance sets UIKit's interface style, which native chrome follows; Uniwind only styles our views.
  const isMounted = useRef(false);
  // The latest `schemeTransition`, read at a scheme change only, so a new function each render reruns nothing.
  const latestTransition = useRef(schemeTransition);
  useLayoutEffect(() => {
    latestTransition.current = schemeTransition;
  });
  useLayoutEffect(() => {
    // The first paint takes the scheme as is; a later change animates from the old scheme's snapshot.
    const drawn = isMounted.current ? latestTransition.current?.() : undefined;
    isMounted.current = true;
    // Uniwind Pro's setTheme takes the transition second; this package types against the free peer, which does not.
    if (drawn)
      (Uniwind.setTheme as (theme: ColorScheme, transition: object) => void)(
        currentColorScheme,
        drawn,
      );
    else Uniwind.setTheme(currentColorScheme);
    Appearance.setColorScheme(currentColorScheme === "system" ? "unspecified" : currentColorScheme);
  }, [currentColorScheme]);
  // On unmount only, so a scheme change does not flash through the device scheme. `unspecified` is the value before
  // mount: `Appearance.getColorScheme()` reports the resolved scheme, so reading it back would pin the device's.
  useLayoutEffect(() => () => Appearance.setColorScheme("unspecified"), []);
  // The app-wide switch follows the prop; a toggle that calls `useHaptic().setEnabled` passes its value back here.
  useLayoutEffect(() => {
    if (haptics !== undefined) hapticsSwitch.setEnabled(haptics);
  }, [haptics]);

  // Text follows the device's text size (Dynamic Type, Android font scale); 0 means no cap.
  const config = useMemo(() => {
    const scaling = { allowFontScaling: true, maxFontSizeMultiplier: maxFontScale ?? 0 };
    return {
      isRTL: isRtl,
      textProps: scaling,
      textInputProps: scaling,
      ...(resolvedMotion === "none" ? { animation: "disable-all" as const } : {}),
    };
  }, [isRtl, maxFontScale, resolvedMotion]);
  // LayoutDirection's own View is `display: contents`, which Yoga skips, so its `direction` never reaches the layout.
  const layout = useMemo(() => ({ flex: 1, direction: currentDirection }), [currentDirection]);
  // Native has no `currentColor` cascade: without this default a bare icon would draw black in dark mode.
  const foreground = useThemeColor("foreground");

  return (
    <DesignSystemContext value={state}>
      <View style={layout}>
        <LayoutDirection rtl={isRtl}>
          <HeroUINativeProvider config={config}>
            <ReducedMotionConfig
              mode={resolvedMotion === "full" ? ReduceMotion.System : ReduceMotion.Always}
            />
            <LucideProvider size={ICON_SIZES.md} color={foreground}>
              {children}
            </LucideProvider>
          </HeroUINativeProvider>
        </LayoutDirection>
      </View>
    </DesignSystemContext>
  );
}
