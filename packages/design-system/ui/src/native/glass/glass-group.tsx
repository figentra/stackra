/**
 * Stackra file contract:
 * Purpose: `GlassGroup`, the row that holds sibling glass controls (a toolbar's buttons, the action bar's segments, a
 *          FAB's menu): on Liquid Glass it is expo-glass-effect's `GlassContainer`, so the shapes merge as they near
 *          each other and morph when one appears; elsewhere a plain View with the same gap.
 * Boundary: layout only; each child draws its own `GlassSurface` or glass button.
 * Runtime: react-native
 * Governing contract: ADR 0320 (decision 7 as amended 2026-10-31).
 */
import { GlassContainer } from "expo-glass-effect";
import type { ReactElement, ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { useGlassMaterial } from "#native/glass/use-glass-material";

/** Sibling glass controls that merge and morph on Liquid Glass. */
export function GlassGroup({
  spacing = 8,
  children,
  style,
  ...rest
}: ViewProps & {
  /** The gap between the controls, in points; also the distance at which their glass merges. */
  readonly spacing?: number | undefined;
  readonly children?: ReactNode;
}): ReactElement {
  const glass = useGlassMaterial();
  if (glass === "liquid")
    return (
      <GlassContainer spacing={spacing} style={[{ gap: spacing }, style]} {...rest}>
        {children}
      </GlassContainer>
    );
  return (
    <View style={[{ gap: spacing }, style]} {...rest}>
      {children}
    </View>
  );
}
