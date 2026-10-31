/**
 * Stackra file contract:
 * Purpose: `materialFill(level, token, mode)`: one material level's fill and backdrop filter in one colour scheme.
 *          A standard level mixes its tint source (the surface role, or another role, with an optional accent tint
 *          that more contrast removes) at its share, floored by the mode; a clear level (tint source `none`) draws
 *          only a black dim, never below `GLASS_CLEAR_DIM_FLOORS` or the mode's plate, plus a label fill at the
 *          label floor. The filter blurs, saturates and brightens the backdrop by the level and the mode.
 * Boundary: pure; `themeVariables` writes the result in the colour blocks.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material, as amended 2026-10-31); ADR 0501 (tokens v2, the materials block).
 */
import type { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { MaterialLevelToken } from "#contracts/types/material-level-token.type";
import { GLASS_CLEAR_DIM_FLOORS } from "#core/constants/glass-clear-dim-floors.constant";

/** A share of a colour, transparent elsewhere. */
const share = (colour: string, amount: string) =>
  `color-mix(in oklch, ${colour} calc(${amount} * 100%), transparent)`;

/** The least fill share of a level: the mode's floor, and for the thick level, which muted text sits on, its own too. */
const floorOf = (level: MaterialLevel) =>
  level === "thick"
    ? "max(var(--material-fill-floor), var(--material-thick-floor))"
    : "var(--material-fill-floor)";

/** The colour a level's fill is mixed from, with its accent tint (none under more contrast). */
function sourceOf(token: MaterialLevelToken): string {
  const base = `var(--${token.tintSource ?? "surface"})`;
  if (!token.tint) return base;
  return `color-mix(in oklch, ${base}, var(--accent) calc(${token.tint} * var(--material-tint-scale) * 100%))`;
}

/** The fill and filter of `level`, the forms `themeVariables` writes for every level. */
export function materialFill(
  level: MaterialLevel,
  token: MaterialLevelToken,
  mode: "light" | "dark",
): Record<string, string> {
  const brightness =
    token.brightness === undefined || mode === "dark"
      ? "var(--material-brightness)"
      : `calc(var(--material-brightness) * ${token.brightness})`;
  const filter = `blur(calc(var(--material-${level}-blur) * var(--material-blur-scale))) saturate(calc(var(--material-${level}-saturate) * var(--material-saturate-scale))) brightness(${brightness})`;
  if (token.tintSource === "none") {
    // Clear glass: a black dim, never below the glyph floor or the mode's plate (0.80 solid).
    const dim = (floor: number) =>
      share(
        "oklch(0 0 0)",
        `clamp(max(${floor}, var(--material-clear-floor)), var(--material-${level}-dim), 1)`,
      );
    return {
      [`--material-${level}-share`]: String(token.fill[mode]),
      [`--material-${level}-dim`]: String(token.dim ?? GLASS_CLEAR_DIM_FLOORS.glyph),
      [`--material-${level}-fill`]: dim(GLASS_CLEAR_DIM_FLOORS.glyph),
      [`--material-${level}-label-fill`]: dim(GLASS_CLEAR_DIM_FLOORS.label),
      [`--material-${level}-filter`]: filter,
    };
  }
  return {
    [`--material-${level}-share`]: String(token.fill[mode]),
    [`--material-${level}-fill`]: share(
      sourceOf(token),
      `clamp(${floorOf(level)}, var(--material-${level}-share) * var(--material-fill-scale), 1)`,
    ),
    [`--material-${level}-filter`]: filter,
  };
}
