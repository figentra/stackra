/**
 * Stackra file contract:
 * Purpose: `SHADOW_STRENGTHS`, the four named strengths a theme's surface, overlay and field shadows can take in the
 *          Theme Studio (none, subtle, medium, strong), per scheme. Written fresh for Stackra (ADR 0501, ADR 0469):
 *          light depth is a soft drop, dark depth a faint rim plus a deeper drop, since a dark page shows depth by
 *          lightness more than by shadow.
 * Boundary: data only; `deriveTheme` copies the picked strength into the theme's shadows.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2).
 */
import type { ShadowToken } from "#contracts/types/shadow-token.type";

const ink = (alpha: number) => `oklch(0.158 0.005 248 / ${alpha})`;
const black = (alpha: number) => `oklch(0 0 0 / ${alpha})`;
const rim = (alpha: number) => `inset 0px 0px 0px 1px oklch(1 0 0 / ${alpha})`;

/** The strengths by role. */
export const SHADOW_STRENGTHS: Readonly<
  Record<
    "surface" | "overlay" | "field",
    Readonly<Record<"none" | "subtle" | "medium" | "strong", ShadowToken>>
  >
> = {
  surface: {
    none: { light: "none", dark: "none" },
    subtle: { light: `0px 1px 2px 0px ${ink(0.06)}, 0px 0px 1px 0px ${ink(0.08)}`, dark: "none" },
    medium: {
      light: `0px 1px 2px 0px ${ink(0.06)}, 0px 4px 10px -2px ${ink(0.08)}`,
      dark: `${rim(0.04)}, 0px 2px 6px 0px ${black(0.35)}`,
    },
    strong: {
      light: `0px 2px 4px 0px ${ink(0.08)}, 0px 10px 24px -6px ${ink(0.14)}`,
      dark: `${rim(0.06)}, 0px 6px 16px 0px ${black(0.5)}`,
    },
  },
  overlay: {
    none: { light: "none", dark: "none" },
    subtle: {
      light: `0px 0px 0px 1px ${ink(0.06)}, 0px 4px 12px -2px ${ink(0.1)}`,
      dark: rim(0.1),
    },
    medium: {
      light: `0px 0px 0px 1px ${ink(0.06)}, 0px 8px 24px -4px ${ink(0.14)}`,
      dark: `${rim(0.12)}, 0px 16px 32px -8px ${black(0.55)}`,
    },
    strong: {
      light: `0px 0px 0px 1px ${ink(0.08)}, 0px 20px 48px -8px ${ink(0.24)}`,
      dark: `${rim(0.16)}, 0px 24px 48px -8px ${black(0.7)}`,
    },
  },
  field: {
    none: { light: "none", dark: "none" },
    subtle: { light: `0px 1px 0px 0px ${ink(0.04)}`, dark: `0px 1px 0px 0px ${black(0.2)}` },
    medium: { light: `0px 1px 2px 0px ${ink(0.08)}`, dark: `0px 1px 2px 0px ${black(0.3)}` },
    strong: {
      light: `0px 1px 2px 0px ${ink(0.1)}, 0px 2px 6px -2px ${ink(0.12)}`,
      dark: `0px 2px 6px 0px ${black(0.4)}`,
    },
  },
};
