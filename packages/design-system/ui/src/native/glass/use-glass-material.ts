/**
 * Stackra file contract:
 * Purpose: `useGlassMaterial()`, the one decision of whether a native glass control draws Liquid Glass: `liquid` on
 *          iOS 26 and later while the user has neither reduced transparency nor darker system colours on, and `solid`
 *          everywhere else, Android and earlier iOS included, and until the settings have answered.
 * Boundary: reads Liquid Glass support and `useTransparencyAllowed()`; draws nothing. The blur on Android 12+ and the
 *           role-by-family choice are `useMaterialRole`'s (ADR 0320 as amended 2026-10-31); this hook stays the quiet
 *           buttons' Liquid-Glass-or-solid switch (ADR 0319).
 * Runtime: react-native
 * Governing contract: ADR 0319 (decision 3); ADR 0320 (decision 7, the material modes and their fallbacks).
 */
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";

import type { GlassMaterial } from "#native/glass/glass-material.type";
import { useTransparencyAllowed } from "#native/glass/use-transparency-allowed";

/**
 * Whether Liquid Glass can be drawn. Both checks: some iOS 26 betas report Liquid Glass without the API, and GlassView
 * crashes there. `expo-glass-effect` is an optional peer: in an app that does not link it the check throws, and the
 * control draws solid.
 */
const LIQUID_GLASS = (() => {
  try {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
})();

/**
 * The material a native glass control draws now.
 * @returns `liquid` where Liquid Glass runs and the settings allow it, otherwise `solid`
 */
export function useGlassMaterial(): GlassMaterial {
  const isAllowed = useTransparencyAllowed();
  return LIQUID_GLASS && isAllowed ? "liquid" : "solid";
}
