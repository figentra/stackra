/**
 * Stackra file contract:
 * Purpose: `useDesignSystemState(props, platform)`, the state every runtime's DesignSystemProvider shares: the colour
 *          scheme, locale, brand, transition and motion level (each controlled or its own), the direction (given, else
 *          the locale's), the motion level lowered by the system's reduce-motion setting, and the setters that keep
 *          their own value and tell the app. The state object keeps its identity until one of its values changes.
 * Boundary: a React hook with no rendering and no side effects; each runtime reads the system's reduce-motion setting
 *           and resolves `system` to light or dark its own way, applies the scheme and direction, and provides the
 *           state through its own context. The web and native DesignSystemProvider both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 3); ADR 0060 (right-to-left).
 */
import { useMemo, useState } from "react";

import type { ColorScheme } from "#contracts/enums/color-scheme.enum";
import type { MotionLevel } from "#contracts/enums/motion-level.enum";
import type { DesignSystemProviderProps } from "#contracts/types/design-system-provider-props.type";
import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { directionOf } from "#core/functions/direction-of.function";
import { resolveMotion } from "#core/functions/resolve-motion.function";

/**
 * The shared design system state.
 * @param props - the provider's values, defaults and change handlers
 * @param platform - whether the system asks for reduced motion, and how `system` resolves to light or dark
 * @returns the state to provide
 */
export function useDesignSystemState(
  {
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
  }: Omit<DesignSystemProviderProps, "children">,
  platform: {
    readonly isSystemReduced: boolean;
    readonly resolveColorScheme: (scheme: ColorScheme) => "light" | "dark";
  },
): DesignSystemState {
  const [ownColorScheme, setOwnColorScheme] = useState<ColorScheme>(defaultColorScheme);
  const [ownLocale, setOwnLocale] = useState(defaultLocale);
  const [ownBrand, setOwnBrand] = useState(defaultBrand);
  const [ownTransition, setOwnTransition] = useState(defaultTransition);
  const [ownMotion, setOwnMotion] = useState<MotionLevel>(defaultMotion);
  const currentMotion = motion ?? ownMotion;
  const resolvedMotion = resolveMotion(currentMotion, platform.isSystemReduced);
  const currentColorScheme = colorScheme ?? ownColorScheme;
  const resolvedColorScheme = platform.resolveColorScheme(currentColorScheme);
  const currentLocale = locale ?? ownLocale;
  const currentBrand = brand ?? ownBrand;
  const currentTransition = transition ?? ownTransition;
  const currentDirection = direction ?? directionOf(currentLocale);

  return useMemo<DesignSystemState>(
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
}
