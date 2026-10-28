/**
 * Stackra file contract:
 * Purpose: `GlassLayer`, the Liquid Glass layer of a glass button: a regular, interactive `GlassView` filling HeroUI
 *          Native's background container in the current colour scheme.
 * Boundary: the layer only; `useGlassButton` decides when a button draws it. Its own file so use-glass-button.tsx
 *           exports only the hook and this component hot-reloads (rule-gap B-6, react/only-export-components).
 * Runtime: react-native
 * Governing contract: ADR 0319 (decisions 2 and 3); ADR 0305 (rules 10 to 13: one declaration per file).
 */
import type { ReactElement } from "react";
import { GlassView } from "expo-glass-effect";
import { StyleSheet } from "react-native";
import { useUniwind } from "uniwind";

/** The Liquid Glass layer, filling the HeroUI Native background container in the current colour scheme. */
export function GlassLayer(): ReactElement {
  const colorScheme = useUniwind().theme === "dark" ? "dark" : "light";
  return (
    <GlassView
      glassEffectStyle="regular"
      colorScheme={colorScheme}
      isInteractive
      style={StyleSheet.absoluteFill}
    />
  );
}
