/**
 * Stackra file contract:
 * Purpose: a theme as W3C Design Tokens (DTCG format) JSON, for Figma variables, Style Dictionary and other tools.
 *          - Colours (roles and palette) by mode; the font stacks as `fontFamily` lists.
 *          - Spacing and radii as `dimension`; motion durations as `duration`.
 *          - The glass material's levels as `number` and `dimension`.
 * Boundary: pure; a value that only another property can resolve (`var(--…)`) is left out, because a DTCG file has no
 *          CSS cascade. Type styles and shadows stay in the CSS and JSON exports.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio); W3C DTCG format (2025.10).
 */
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { Theme } from "#contracts/types/theme.type";

/** One DTCG token. */
const value = ($type: string, $value: unknown) => ({ $type, $value });

const isResolved = (css: string) => !css.includes("var(");

/** `"Geist", ui-sans-serif` as `["Geist", "ui-sans-serif"]`. */
const families = (stack: string) =>
  stack.split(",").map((family) => family.trim().replaceAll(/^["']|["']$/g, ""));

/** A theme's colours of one mode as DTCG `color` tokens. */
const colours = (theme: Theme, mode: "light" | "dark") =>
  Object.fromEntries(
    [...Object.entries(theme.colors), ...Object.entries(theme.palette)].map(([name, token]) => [
      name,
      value("color", token[mode]),
    ]),
  );

/** Lengths keyed by name as DTCG `dimension` tokens, leaving out those that refer to another property. */
const dimensions = (lengths: Readonly<Record<string, string>>) =>
  Object.fromEntries(
    Object.entries(lengths)
      .filter(([, length]) => isResolved(length))
      .map(([name, length]) => [name, value("dimension", length)]),
  );

/** `theme` as a DTCG token tree. */
export function themeToDtcg(theme: Theme): Record<string, unknown> {
  return {
    $description: `The "${theme.name}" theme of the Stackra Design System.`,
    color: { light: colours(theme, "light"), dark: colours(theme, "dark") },
    font: Object.fromEntries(
      Object.entries(theme.fontFamily).map(([name, stack]) => [
        name,
        value("fontFamily", families(stack)),
      ]),
    ),
    space: dimensions(theme.spacing),
    radius: dimensions({
      base: theme.radius.base,
      field: theme.radius.field,
      ...theme.radius.steps,
    }),
    duration: Object.fromEntries(
      Object.entries(theme.motion).map(([name, step]) => [name, value("duration", step.duration)]),
    ),
    material: Object.fromEntries(
      MaterialLevel.map((level) => {
        const { fill, blur, saturation } = theme.materials.levels[level];
        return [
          level,
          {
            fill: { light: value("number", fill.light), dark: value("number", fill.dark) },
            blur: value("dimension", blur),
            saturation: value("number", saturation),
          },
        ];
      }),
    ),
  };
}
