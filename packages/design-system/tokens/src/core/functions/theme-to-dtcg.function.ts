/**
 * Stackra file contract:
 * Purpose: a theme as W3C Design Tokens (DTCG format 2025.10) JSON, for Figma variables, Style Dictionary and other
 *          tools, in the format's object forms (ADR 0340 decision 7):
 *          - Colours (roles and palette) by mode as `{ colorSpace, components, alpha?, hex }`: an oklch colour keeps
 *            its oklch components, anything else is given in sRGB from its hex. The hex fallback is the per-token hex
 *            email and sign-in surfaces read.
 *          - The font stacks as `fontFamily` lists.
 *          - Spacing, radii and blur as `dimension` `{ value, unit }` in px or rem; motion durations as `duration`
 *            `{ value, unit }` in ms or s.
 *          - The glass material's levels as `number` and `dimension`.
 * Boundary: pure; a value the format cannot hold (`var(--…)`, a percentage or an `em` length) is left out, because a
 *          DTCG file has no CSS cascade. Type styles and shadows stay in the CSS and JSON exports.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio); ADR 0340 (decision 7); W3C DTCG
 *          format (2025.10).
 */
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { ColorToken } from "#contracts/types/color-token.type";
import type { Theme } from "#contracts/types/theme.type";

/** One DTCG token. */
const value = ($type: string, $value: unknown) => ({ $type, $value });

const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/;
const LENGTH = /^(-?\d+(?:\.\d+)?|-?\.\d+)(px|rem)$/;
const TIME = /^(\d+(?:\.\d+)?|\.\d+)(ms|s)$/;

const round = (number: number) => Math.round(number * 10_000) / 10_000;

/** `"Geist", ui-sans-serif` as `["Geist", "ui-sans-serif"]`. */
const families = (stack: string) =>
  stack.split(",").map((family) => family.trim().replaceAll(/^["']|["']$/g, ""));

/** A colour in DTCG's object form: oklch components when it is oklch, sRGB from its hex otherwise. */
function colour(css: string, hex: string) {
  const fallback = hex.slice(0, 7);
  const match = OKLCH.exec(css.trim());
  if (match) {
    const [lightness, chroma, hue] = match.slice(1, 4).map(Number) as [number, number, number];
    return {
      colorSpace: "oklch",
      components: [lightness, chroma, hue],
      ...(match[4] === undefined ? {} : { alpha: Number(match[4]) }),
      hex: fallback,
    };
  }
  const channel = (at: number) => round(Number.parseInt(hex.slice(at, at + 2), 16) / 255);
  return {
    colorSpace: "srgb",
    components: [channel(1), channel(3), channel(5)],
    ...(hex.length === 9 ? { alpha: channel(7) } : {}),
    hex: fallback,
  };
}

/** A theme's colours of one mode as DTCG `color` tokens. */
const colours = (theme: Theme, mode: "light" | "dark") =>
  Object.fromEntries(
    [...Object.entries(theme.colors), ...Object.entries(theme.palette)].map(
      ([name, token]: [string, ColorToken]) => [
        name,
        value("color", colour(token[mode], mode === "light" ? token.hexLight : token.hexDark)),
      ],
    ),
  );

/** A px or rem length as a DTCG `dimension` value, or `undefined` for anything else. */
function dimension(length: string) {
  const match = LENGTH.exec(length.trim());
  return match ? { value: Number(match[1]), unit: match[2] } : undefined;
}

/** Lengths keyed by name as DTCG `dimension` tokens, leaving out those the format cannot hold. */
const dimensions = (lengths: Readonly<Record<string, string>>) =>
  Object.fromEntries(
    Object.entries(lengths).flatMap(([name, length]) => {
      const parsed = dimension(length);
      return parsed ? [[name, value("dimension", parsed)]] : [];
    }),
  );

/** Durations keyed by name as DTCG `duration` tokens, leaving out those the format cannot hold. */
const durations = (theme: Theme) =>
  Object.fromEntries(
    Object.entries(theme.motion).flatMap(([name, step]) => {
      const match = TIME.exec(step.duration.trim());
      return match ? [[name, value("duration", { value: Number(match[1]), unit: match[2] })]] : [];
    }),
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
    duration: durations(theme),
    material: Object.fromEntries(
      MaterialLevel.map((level) => {
        const { fill, blur, saturation } = theme.materials.levels[level];
        const blurDimension = dimension(blur);
        return [
          level,
          {
            fill: { light: value("number", fill.light), dark: value("number", fill.dark) },
            ...(blurDimension ? { blur: value("dimension", blurDimension) } : {}),
            saturation: value("number", saturation),
          },
        ];
      }),
    ),
  };
}
