/**
 * Stackra file contract:
 * Purpose: `useGlassButton(variant)`, the native glass look of the quiet button variants (ADR 0319): secondary,
 *          tertiary and outline draw on the regular material level, as Liquid Glass where the platform has it, else a
 *          blur view under the theme's `surface` at the level's fill share. It returns the HeroUI Native `background`
 *          layer and the class that clears the variant's own fill, or nothing when the variant stays solid or
 *          `useGlassMaterial()` says `solid`.
 * Boundary: the layer only. The label keeps the variant's foreground colour, so its contrast is the one it has on
 *          the solid surface the fill stands for. Ghost keeps HeroUI's look (native has no hover), primary and danger
 *          stay solid. Reads the stackra theme's materials.
 * Runtime: react-native
 * Governing contract: ADR 0319 (decisions 2 and 3); ADR 0320 (decision 7); ADR 0302 (decision 3).
 */
import { MATERIAL_MODES, STACKRA_THEME } from "@stackra/tokens";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { Button as HeroButton, useThemeColor } from "heroui-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useUniwind } from "uniwind";

import type { ButtonVariant } from "#contracts/enums/button-variant.enum";

import { type GlassMaterial, useGlassMaterial } from "./use-glass-material";

/** The variants that draw on glass; the web's glass ghost exists only under a pointer. */
const GLASS_VARIANTS: ReadonlySet<ButtonVariant> = new Set(["secondary", "tertiary", "outline"]);

/** What a glass variant hands HeroUI Native's button. */
export interface GlassButtonLook {
  /** The layer HeroUI Native draws behind the content, inside the button's radius. */
  readonly background: ReactNode;
  /** Clears the variant's own fill so the layer shows. */
  readonly className: string;
}

// shortcut: the stackra theme's regular level, the only theme there is; a second theme passes its materials
// through the DesignSystemProvider.
const REGULAR = STACKRA_THEME.materials.levels.regular;

/** The regular level's fill share in one colour mode, through the glass mode's factors. */
const fillShare = (scheme: "light" | "dark") => {
  const { fillScale, fillFloor } = MATERIAL_MODES.glass;
  return Math.min(1, Math.max(fillFloor, REGULAR.fill[scheme] * fillScale));
};

/** The glass layer itself, filling the HeroUI Native background container. */
function GlassLayer({ material }: { readonly material: Exclude<GlassMaterial, "solid"> }) {
  const scheme = useUniwind().theme === "dark" ? "dark" : "light";
  const surface = useThemeColor("surface");
  if (material === "liquid") {
    return <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill} />;
  }
  return (
    <BlurView tint={scheme} style={StyleSheet.absoluteFill}>
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: surface, opacity: fillShare(scheme) }]}
      />
    </BlurView>
  );
}

/**
 * The glass look of `variant`, agreed by Button, IconButton and CloseButton.
 * @param variant - the button's variant, after its default
 * @returns the background layer and class, or `undefined` when the button draws HeroUI's solid look
 */
export function useGlassButton(variant: ButtonVariant): GlassButtonLook | undefined {
  const material = useGlassMaterial();
  if (material === "solid" || !GLASS_VARIANTS.has(variant)) return undefined;
  return {
    background: (
      <HeroButton.Background>
        <GlassLayer material={material} />
      </HeroButton.Background>
    ),
    className: "bg-transparent",
  };
}
