/**
 * Stackra file contract:
 * Purpose: `NativeTokens`, a theme's size, shape, type-scale and stacking values as React Native numbers (px), the
 *          native keys of ADR 0501; colours reach native as Uniwind variables instead.
 * Boundary: a type only; `nativeTokens(theme)` builds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2: native keys).
 */
import type { MaterialFamily } from "#contracts/enums/material-family.enum";
import type { MaterialMode } from "#contracts/enums/material-mode.enum";
import type { MaterialRoleMap } from "#contracts/types/material-role-map.type";
/** A theme's numeric values for React Native. */
export interface NativeTokens {
  /** The spacing unit (density), px. */
  readonly spacing: number;
  /** The control heights by size. */
  readonly controlHeight: Readonly<Record<string, number>>;
  /** The icon sizes by size. */
  readonly iconSize: Readonly<Record<string, number>>;
  /** The least hit area: the theme's, never under the 44pt iOS and Android minimum. */
  readonly touchTarget: number;
  /** The page frame. */
  readonly page: {
    readonly padding: number;
    readonly gutter: number;
    readonly contentMaxWidth: number;
  };
  /** The breakpoints in px, by name. */
  readonly breakpoints: Readonly<Record<string, number>>;
  /** The hairline, in px. */
  readonly borderWidth: number;
  /** A form field's edge, in px. */
  readonly fieldBorderWidth: number;
  /** `continuous` when the theme draws squircle corners (iOS `borderCurve`), else `circular`. */
  readonly borderCurve: "continuous" | "circular";
  /** The focus ring. */
  readonly focusRing: { readonly width: number; readonly offset: number };
  /** The state layer's foreground shares, 0 to 1, by state. */
  readonly state: Readonly<Record<string, number>>;
  /** The opacities, 0 to 1, by name. */
  readonly opacity: Readonly<Record<string, number>>;
  /** The named component sizes. */
  readonly sizes: Readonly<Record<string, number>>;
  /** The stacking order. */
  readonly zIndex: Readonly<Record<string, number>>;
  /** The radius roles and per-component radii. */
  readonly radius: Readonly<Record<string, number>>;
  /** The utility type scale in px (React Native takes no `rem` or unitless line height). */
  readonly typeScale: Readonly<
    Record<
      string,
      {
        readonly fontSize: number;
        readonly lineHeight: number;
        readonly fontWeight?: number | undefined;
        readonly letterSpacing?: number | undefined;
      }
    >
  >;
  /**
   * The material on native (ADR 0320 as amended 2026-10-31): the theme's family and default mode, each family's role
   * map, the clear-glass dim floors and the icon strokes by weight.
   */
  readonly materials: {
    readonly family: MaterialFamily;
    readonly defaultMode: MaterialMode;
    readonly roles: { readonly [Family in MaterialFamily]: MaterialRoleMap };
    readonly dim: { readonly theme: number; readonly glyph: number; readonly label: number };
  };
  /** The icon stroke on the 24px grid, by text weight. */
  readonly iconStroke: Readonly<Record<string, number>>;
}
