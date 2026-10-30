/**
 * Stackra file contract:
 * Purpose: `useDirection()`, the text direction where a native component renders: a `Bidi` block's above it, else the
 *          design system provider's, else React Native's own. Directional motion reads it, so a sheet slides in from
 *          the inline end and a swipe or a chevron turns the right way in Arabic.
 * Boundary: reads two contexts and `I18nManager`; never throws outside a provider.
 * Runtime: react-native
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0060.
 */
import { use } from "react";
import { I18nManager } from "react-native";

import type { Direction } from "#contracts/enums/direction.enum";
import { BidiDirectionContext } from "#native/bidi/bidi-direction-context";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";

/**
 * The nearest direction.
 *
 * @example
 * const sign = useDirection() === "rtl" ? -1 : 1;
 * offset.value = withSpring(24 * sign);
 */
export function useDirection(): Direction {
  const local = use(BidiDirectionContext);
  const app = use(DesignSystemContext)?.direction;
  return local ?? app ?? (I18nManager.isRTL ? "rtl" : "ltr");
}
