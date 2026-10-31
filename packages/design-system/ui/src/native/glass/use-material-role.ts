/**
 * Stackra file contract:
 * Purpose: `useMaterialRole(role)`: how a native surface of `role` is drawn, the web's role map on native (ADR 0320
 *          as amended 2026-10-31):
 *          - the family (`DesignSystemProvider` `family`, else the stackra theme's) picks the role's level; a `solid`
 *            level, or the `solid` mode, draws solid;
 *          - `glass` and `glass-clear` draw Liquid Glass (`liquid-regular`, `liquid-clear`) where `useGlassMaterial`
 *            says `liquid` (iOS 26+, transparency allowed);
 *          - otherwise the front family draws a real blur (`blur`) on iOS before 26 and on Android 12+ (API 31,
 *            `RenderEffect`), while transparency is allowed;
 *          - everything else draws the tonal solid: Android before 12, the studio family, reduced transparency and
 *            darker system colours.
 * Boundary: decides only; `GlassSurface` draws. A theme's role overrides reach native when the native theme store
 *           carries `nativeTokens(theme)`; until then the stackra theme's role maps apply.
 * Runtime: react-native
 * Governing contract: ADR 0320 (decisions 1, 4 and 7 as amended 2026-10-31).
 */
import { MATERIAL_FAMILY_ROLES, STACKRA_THEME } from "@stackra/tokens";
import type { MaterialFamily, MaterialRole } from "@stackra/tokens/contracts";
import { use } from "react";
import { Platform } from "react-native";

import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import type { MaterialRendering } from "#native/glass/material-rendering.type";
import { useGlassMaterial } from "#native/glass/use-glass-material";
import { useTransparencyAllowed } from "#native/glass/use-transparency-allowed";

/** The first Android API with a real blur (`RenderEffect`, Android 12). */
const ANDROID_BLUR_API = 31;

/** Whether this device draws a real backdrop blur: every iOS, and Android 12 or later. */
const CAN_BLUR =
  Platform.OS === "ios" ||
  (Platform.OS === "android" && Number(Platform.Version) >= ANDROID_BLUR_API);

const familyOf = (family: string | undefined): MaterialFamily =>
  family === "front" || family === "studio" ? family : (STACKRA_THEME.materials.family ?? "studio");

/** How a surface of `role` is drawn now. */
export function useMaterialRole(role: MaterialRole): MaterialRendering {
  const state = use(DesignSystemContext);
  const glass = useGlassMaterial();
  const isAllowed = useTransparencyAllowed();
  const family = familyOf(state?.family);
  const mode = state?.material ?? STACKRA_THEME.materials.defaultMode ?? "glass";
  const level = MATERIAL_FAMILY_ROLES[family][role];
  if (level === "solid" || mode === "solid" || !isAllowed) return "solid";
  if (glass === "liquid" && (level === "glass" || level === "glass-clear"))
    return level === "glass" ? "liquid-regular" : "liquid-clear";
  return family === "front" && CAN_BLUR ? "blur" : "solid";
}
