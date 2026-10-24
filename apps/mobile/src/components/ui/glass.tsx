/**
 * Stackra file contract:
 * Purpose: the material layer of the design-system showcase (ADR 0320): a level (thin, regular, thick) drawn in the
 *          app's one material mode, decided in `useMaterialMode` alone: `liquid` where the system has Liquid Glass
 *          (iOS 26+), else `glass` (the tokens' default), and `solid` while the user asks for reduced transparency or more contrast.
 *          Liquid draws regular and thick as Liquid Glass (following the in-app colour scheme); every other case is a
 *          blur with a `surface` wash at the level's fill for the mode and scheme, a hairline edge and a top
 *          highlight; solid is the opaque surface with the edge.
 * Boundary: one presentational component and its mode hook; the values come from `materials.ts`. A material frames
 *          samples and never sits under one, and never stacks on another material layer.
 * Runtime: react-native
 * Governing contract: ADR 0320 (decisions 4 and 7); ADR 0060 (light, dark); ADR 0007 (documentation).
 */
import { useDesignSystem } from "@stackra/ui/native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo, View, type StyleProp, type ViewStyle } from "react-native";

import { resolveMaterial, type MaterialLevel, type MaterialMode } from "./materials";

const SYSTEM_MODE: MaterialMode = isLiquidGlassAvailable() ? "liquid" : "glass";

// shortcut: the edge and highlight shares of `materials.ts` as Uniwind classes, until the tokens render them.
const EDGE = "border border-foreground/10 dark:border-foreground/12";
const HIGHLIGHT = "absolute inset-x-4 top-0 h-px bg-white/70 dark:bg-white/9";

/**
 * The app's material mode: Liquid Glass where the system has it, else glass, and solid while the user asks for
 * reduced transparency (iOS) or darker colours, that is more contrast (iOS). The one place the mode is decided.
 */
function useMaterialMode(): MaterialMode {
  const [isSolid, setSolid] = useState({ transparency: false, contrast: false });
  useEffect(() => {
    let isMounted = true;
    void Promise.all([
      AccessibilityInfo.isReduceTransparencyEnabled(),
      AccessibilityInfo.isDarkerSystemColorsEnabled(),
    ]).then(([transparency, contrast]) => isMounted && setSolid({ transparency, contrast }));
    const subscriptions = [
      AccessibilityInfo.addEventListener("reduceTransparencyChanged", (transparency) =>
        setSolid((previous) => ({ ...previous, transparency })),
      ),
      AccessibilityInfo.addEventListener("darkerSystemColorsChanged", (contrast) =>
        setSolid((previous) => ({ ...previous, contrast })),
      ),
    ];
    return () => {
      isMounted = false;
      for (const subscription of subscriptions) subscription.remove();
    };
  }, []);
  return isSolid.transparency || isSolid.contrast ? "solid" : SYSTEM_MODE;
}

/** Props of {@link Glass}. */
export interface GlassProps {
  /** The content on the material. */
  children: ReactNode;
  /** How much of the surface the layer carries: thin (hero tiles), regular (cards, panels, strips), thick. */
  level?: MaterialLevel;
  /** The corner radius, in points. */
  radius?: number;
  /** The inner padding, in points. */
  padding?: number;
  /** Whether Liquid Glass reacts to touch; off for decoration. */
  isInteractive?: boolean;
  /** Layout extras (gap, alignment, size, transform); the material itself is not styled from outside. */
  style?: StyleProp<ViewStyle>;
}

/** A material layer at the given level, in the app's material mode. */
export function Glass({
  children,
  level = "regular",
  radius = 24,
  padding = 20,
  isInteractive = true,
  style,
}: GlassProps) {
  const { resolvedColorScheme } = useDesignSystem();
  const mode = useMaterialMode();
  const { fill, blur } = resolveMaterial(level, mode, resolvedColorScheme);
  const frame = [{ borderRadius: radius, borderCurve: "continuous" as const, padding }, style];
  const wash = (
    <View
      pointerEvents="none"
      className="absolute inset-0 bg-surface"
      style={{ opacity: fill, borderRadius: radius, borderCurve: "continuous" }}
    />
  );

  if (mode === "solid")
    return (
      <View className={`bg-surface ${EDGE}`} style={frame}>
        {children}
      </View>
    );
  if (mode === "liquid" && level !== "thin")
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme={resolvedColorScheme}
        isInteractive={isInteractive}
        style={frame}
      >
        {/* Liquid Glass carries the regular level itself; thick adds its surface share on top. */}
        {level === "thick" ? wash : null}
        {children}
      </GlassView>
    );
  return (
    <View className={`overflow-hidden ${EDGE}`} style={frame}>
      <BlurView
        intensity={Math.min(100, blur)}
        tint={resolvedColorScheme}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
      />
      {wash}
      <View pointerEvents="none" className={HIGHLIGHT} />
      {children}
    </View>
  );
}
