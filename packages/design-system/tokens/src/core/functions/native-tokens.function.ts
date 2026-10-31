/**
 * Stackra file contract:
 * Purpose: `nativeTokens(theme)`: the theme's size, shape, type-scale and stacking values as React Native numbers,
 *          so a native component reads the same values the web stylesheet writes (ADR 0501 native keys). The radius
 *          roles are computed as the web's (`control` the field radius, `control-inner` 4px less with a 2px floor,
 *          `container` twice the field radius capped at 24, `pill`), and a theme's `radius.steps` override wins.
 * Boundary: pure. A value with no px form is left out of its record (or 0 for a scalar); colours are Uniwind's.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2); ADR 0302 (Stackra Design System).
 */
import type { NativeTokens } from "#contracts/types/native-tokens.type";
import type { Theme } from "#contracts/types/theme.type";
import { MaterialFamily } from "#contracts/enums/material-family.enum";
import { MaterialRole } from "#contracts/enums/material-role.enum";
import { GLASS_CLEAR_DIM_FLOORS } from "#core/constants/glass-clear-dim-floors.constant";
import { lengthPx } from "#core/functions/length-px.function";
import { materialRoleLevel } from "#core/functions/material-role-level.function";

/** The least hit area on iOS (44pt) and Android (48dp is advised; 44 is the floor both meet). */
const NATIVE_TOUCH_TARGET = 44;

/** Each length of `record` in px, dropping the ones with no px form. */
const pxRecord = (theme: Theme, record: Readonly<Record<string, string>>) =>
  Object.fromEntries(
    Object.entries(record).flatMap(([name, length]) => {
      const px = lengthPx(theme, length);
      return px === undefined ? [] : [[name, px]];
    }),
  );

/** Each number of `record` as a number. */
const numbers = (record: Readonly<Record<string, string>>) =>
  Object.fromEntries(Object.entries(record).map(([name, share]) => [name, Number(share)]));

/** The theme's values for React Native. */
export function nativeTokens(theme: Theme): NativeTokens {
  const { layout, typeScale } = theme;
  const px = (length: string) => lengthPx(theme, length) ?? 0;
  const field = px(theme.radius.field);
  const roles = {
    control: field,
    "control-inner": Math.max(2, field - 4),
    container: Math.min(field * 2, 24),
    pill: 9999,
  };
  const steps = pxRecord(theme, theme.radius.steps);
  const control = steps["control"] ?? roles.control;
  const container = steps["container"] ?? roles.container;
  const radius = {
    ...roles,
    "container-inner": Math.max(2, container - 4),
    button: control,
    card: container,
    chip: 9999,
    badge: 9999,
    avatar: 9999,
    tooltip: control,
    modal: container,
    toast: container,
    table: container,
    ...steps,
  };
  return {
    spacing: px(layout.spacing),
    controlHeight: pxRecord(theme, layout.controlHeight),
    iconSize: pxRecord(theme, layout.iconSize),
    touchTarget: Math.max(px(layout.touchTarget), NATIVE_TOUCH_TARGET),
    page: {
      padding: px(layout.page.padding),
      gutter: px(layout.page.gutter),
      contentMaxWidth: px(layout.page.contentMaxWidth),
    },
    breakpoints: pxRecord(theme, layout.breakpoints),
    borderWidth: px(layout.borderWidth),
    fieldBorderWidth: px(layout.fieldBorderWidth),
    borderCurve: layout.cornerShape === "squircle" ? "continuous" : "circular",
    focusRing: { width: px(layout.focusRing.width), offset: px(layout.focusRing.offset) },
    state: numbers(layout.state),
    opacity: numbers(layout.opacity),
    sizes: pxRecord(theme, layout.sizes),
    zIndex: numbers(layout.zIndex),
    radius,
    typeScale: Object.fromEntries(
      Object.entries(typeScale.sizes).map(([name, step]) => {
        const fontSize = px(step.size);
        const lineHeight = /^[\d.]+$/.test(step.lineHeight)
          ? Math.round(fontSize * Number(step.lineHeight) * 100) / 100
          : px(step.lineHeight);
        const tracking = step.tracking?.trim();
        const letterSpacing =
          tracking === undefined
            ? undefined
            : tracking.endsWith("em") && !tracking.endsWith("rem")
              ? fontSize * Number.parseFloat(tracking)
              : px(tracking);
        return [
          name,
          {
            fontSize,
            lineHeight,
            ...(step.weight === undefined ? {} : { fontWeight: step.weight }),
            ...(letterSpacing === undefined ? {} : { letterSpacing }),
          },
        ];
      }),
    ),
    materials: {
      family: theme.materials.family ?? "studio",
      defaultMode: theme.materials.defaultMode ?? "glass",
      roles: Object.fromEntries(
        MaterialFamily.map((family) => [
          family,
          Object.fromEntries(
            MaterialRole.map((role) => [role, materialRoleLevel(theme.materials, family, role)]),
          ),
        ]),
      ) as NativeTokens["materials"]["roles"],
      dim: {
        theme: theme.materials.levels["glass-clear"].dim ?? GLASS_CLEAR_DIM_FLOORS.glyph,
        ...GLASS_CLEAR_DIM_FLOORS,
      },
    },
    iconStroke: { ...theme.iconStroke },
  };
}
