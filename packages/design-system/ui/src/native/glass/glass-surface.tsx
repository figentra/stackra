/**
 * Stackra file contract:
 * Purpose: `GlassSurface`, the one native material layer (ADR 0320 as amended 2026-10-31): a surface of a material
 *          role, drawn as `useMaterialRole` decides:
 *          - `liquid-regular` / `liquid-clear`: an expo-glass-effect `GlassView` in the colour scheme, interactive when
 *            pressed controls sit on it, accent-tinted when prominent; clear glass sits over a black dim at the floor
 *            (0.50 behind glyphs, 0.55 behind a label);
 *          - `blur`: an expo-blur `BlurView` (front family; Android 12+ against the nearest `MaterialBackdrop`, and
 *            solid without one), with clear glass's dim under it;
 *          - `solid`: the role's opaque surface with the tonal lift Material 3 uses (a share of the accent laid over
 *            it by elevation), or the 0.80 black plate for media controls.
 * Boundary: the only native file that imports `GlassView` or `BlurView` besides the glass button's layer
 *           (`stackra/no-glass-import` refuses them elsewhere). The colours are Uniwind's theme classes.
 * Runtime: react-native
 * Governing contract: ADR 0320 (decisions 4 and 7 as amended 2026-10-31); ADR 0319 (decision 3).
 */
import { GLASS_CLEAR_DIM_FLOORS } from "@stackra/tokens";
import type { MaterialRole } from "@stackra/tokens/contracts";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { useThemeColor } from "heroui-native";
import { use, type ReactElement } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useUniwind } from "uniwind";

import { BlurTargetContext } from "#native/glass/blur-target-context";
import type { GlassSurfaceProps } from "#native/glass/glass-surface.props";
import { useMaterialRole } from "#native/glass/use-material-role";

/** The opaque surface of each role: bars on the page ground, overlays on the overlay role, the rest on surface. */
const SOLID_CLASS: Partial<Record<MaterialRole, string>> = {
  "nav-bar": "bg-background",
  "tab-bar": "bg-background",
  sheet: "bg-overlay",
  modal: "bg-overlay",
  popover: "bg-overlay",
  menu: "bg-overlay",
  toast: "bg-overlay",
  command: "bg-overlay",
  tooltip: "bg-overlay",
  "segmented-track": "bg-default",
  "media-controls": "bg-black",
};

/** The tonal lift: how much accent lies over a solid surface, by how far it floats (Material 3's tonal elevation). */
const TONAL_LIFT: Partial<Record<MaterialRole, number>> = {
  sheet: 0.08,
  modal: 0.08,
  popover: 0.08,
  menu: 0.08,
  command: 0.08,
  toast: 0.06,
  "action-bar": 0.06,
  fab: 0.06,
  "tab-bar": 0.04,
};

/** The solid plate under media controls: what reduced transparency draws (ADR 0320 §1.6). */
const MEDIA_PLATE = 0.8;

/** The blur strength of expo-blur, 1 to 100, for the functional layer. */
const BLUR_INTENSITY = 60;

/** A surface of a material role, in Liquid Glass, a blur or the tonal solid. */
export function GlassSurface({
  material: role,
  holdsLabel = false,
  isInteractive = false,
  isProminent = false,
  className,
  style,
  children,
  ...rest
}: GlassSurfaceProps): ReactElement {
  const rendering = useMaterialRole(role);
  const target = use(BlurTargetContext);
  const isDark = useUniwind().theme === "dark";
  const accent = useThemeColor("accent");
  const dim = holdsLabel ? GLASS_CLEAR_DIM_FLOORS.label : GLASS_CLEAR_DIM_FLOORS.glyph;
  const isClear = role === "media-controls";
  const dimLayer = isClear ? (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0, 0, 0, ${dim})` }]}
    />
  ) : null;

  if (rendering === "liquid-regular" || rendering === "liquid-clear")
    return (
      <View
        {...rest}
        {...(className === undefined ? {} : { className })}
        style={[styles.clip, style]}
      >
        {dimLayer}
        <GlassView
          glassEffectStyle={rendering === "liquid-clear" ? "clear" : "regular"}
          colorScheme={isDark ? "dark" : "light"}
          isInteractive={isInteractive}
          {...(isProminent ? { tintColor: accent } : {})}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );

  // Android blurs only a `MaterialBackdrop`'s content; without one the surface is solid.
  if (rendering === "blur" && (Platform.OS !== "android" || target !== null))
    return (
      <View
        {...rest}
        {...(className === undefined ? {} : { className })}
        style={[styles.clip, style]}
      >
        {dimLayer}
        <BlurView
          intensity={BLUR_INTENSITY}
          tint={isClear ? "dark" : isDark ? "systemMaterialDark" : "systemMaterialLight"}
          blurMethod="dimezisBlurViewSdk31Plus"
          {...(target === null ? {} : { blurTarget: target })}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );

  const lift = TONAL_LIFT[role] ?? 0;
  return (
    <View
      {...rest}
      className={[SOLID_CLASS[role] ?? "bg-surface", className].filter(Boolean).join(" ")}
      style={[
        styles.clip,
        isClear ? { opacity: 1, backgroundColor: `rgba(0, 0, 0, ${MEDIA_PLATE})` } : null,
        style,
      ]}
    >
      {lift > 0 ? (
        <View
          pointerEvents="none"
          className="bg-accent"
          style={[StyleSheet.absoluteFill, { opacity: lift }]}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ clip: { overflow: "hidden" } });
