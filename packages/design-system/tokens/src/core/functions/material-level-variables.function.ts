/**
 * Stackra file contract:
 * Purpose: `materialLevelVariables(theme, mode)`: the per-level material properties of one colour scheme beyond the
 *          fill and filter: the edge, the rim light, the specular lower rim, the inner depth and the elevation, as
 *          ready-to-draw values (`--material-<level>-edge`, `-rim`, `-specular`, `-depth`, `-elevation`), and
 *          the fill and filter (`materialFill`).
 *          A level that leaves a field out takes the theme-wide `edge` and `highlight`, no specular, no depth and no
 *          elevation, so a theme written before the glass levels draws as before.
 * Boundary: pure; the mode factors (`--material-specular-scale`, `--material-clear-floor`) and the accessibility
 *          scales (`--material-rim-scale`, `--material-edge-floor`, `--material-tint-scale`) are read, not written.
 *          Dark schemes draw brightness 1 (ADR 0320 note: white washes light text out on dark).
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material, as amended 2026-10-31); ADR 0501 (tokens v2, the materials block).
 */
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { Theme } from "#contracts/types/theme.type";

/** No shadow, as a box-shadow layer that keeps a comma list valid. */
const NONE = "0 0 #0000";

/** A share of a colour, transparent elsewhere. */
const share = (colour: string, amount: string) =>
  `color-mix(in oklch, ${colour} calc(${amount} * 100%), transparent)`;

/** The edge, rim, specular, depth and elevation of every level in `mode`. */
export function materialLevelVariables(
  theme: Theme,
  mode: "light" | "dark",
): Record<string, string> {
  return Object.fromEntries(
    MaterialLevel.flatMap((level) => {
      const token = theme.materials.levels[level];
      const clear = token.tintSource === "none";
      const edge =
        token.edge === undefined ? "var(--material-edge-share)" : String(token.edge[mode]);
      const rim =
        token.rim === undefined ? "var(--material-highlight-share)" : String(token.rim[mode]);
      const depth = token.innerDepth;
      return [
        [
          `--material-${level}-edge`,
          share(
            clear ? "oklch(1 0 0)" : "var(--foreground)",
            `max(${edge}, var(--material-edge-floor))`,
          ),
        ],
        [`--material-${level}-rim`, share("oklch(1 0 0)", `${rim} * var(--material-rim-scale)`)],
        [
          `--material-${level}-specular`,
          token.specular
            ? `inset 0 -1px 0 0 ${share("oklch(1 0 0)", `${token.specular} * ${rim} * var(--material-specular-scale) * var(--material-rim-scale)`)}`
            : NONE,
        ],
        [
          `--material-${level}-depth`,
          depth
            ? `inset 0 -${depth.y} ${depth.blur} 0 ${share("oklch(0 0 0)", `${depth.alpha[mode]} * min(1, var(--material-specular-scale))`)}`
            : NONE,
        ],
        [
          `--material-${level}-elevation`,
          !token.elevation || token.elevation === "none"
            ? NONE
            : token.elevation === "raised"
              ? "var(--raised-shadow, var(--surface-shadow))"
              : `var(--${token.elevation}-shadow)`,
        ],
      ];
    }),
  );
}
