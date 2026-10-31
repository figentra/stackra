/**
 * Stackra file contract:
 * Purpose: a theme as W3C Design Tokens (DTCG format 2025.10) JSON, for Figma variables, Style Dictionary and other
 *          tools, in the format's object forms (ADR 0340 decision 7):
 *          - Colours (roles and palette) by mode as `{ colorSpace, components, alpha?, hex }`: an oklch colour keeps
 *            its oklch components, anything else is given in sRGB from its hex. The hex fallback is the per-token hex
 *            email and sign-in surfaces read.
 *          - The font stacks as `fontFamily` lists.
 *          - Spacing, radii and blur as `dimension` `{ value, unit }` in px or rem; motion durations as `duration`
 *            `{ value, unit }` in ms or s, and the named easings as `cubicBezier`.
 *          - The glass material's levels as `number` and `dimension`.
 *          - Tokens v2 (ADR 0501): the layout knobs as `dimension` (a spacing multiple resolved to px) and `number`
 *            (state shares, opacities, z-indices), easings as `cubicBezier`, shadows as `shadow` layer lists and the
 *            type scale and text styles as `typography` composites.
 * Boundary: pure; a value the format cannot hold (`var(--…)`, a percentage or an `em` length) is left out, because a
 *          DTCG file has no CSS cascade.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio); ADR 0340 (decision 7); W3C DTCG
 *          format (2025.10).
 */
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import type { ColorToken } from "#contracts/types/color-token.type";
import type { FontFamilyName } from "#contracts/types/font-family-name.type";
import type { Theme } from "#contracts/types/theme.type";
import { easingBezier } from "#core/functions/easing-bezier.function";
import { fontStackOf } from "#core/functions/font-stack-of.function";
import { lengthPx } from "#core/functions/length-px.function";
import { motionTiming } from "#core/functions/motion-timing.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";

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

/**
 * A px or rem length as a DTCG `dimension` value; a multiple of the spacing unit (and a radius variable a role names)
 * resolved to px against `theme`; `undefined` for anything else.
 */
function dimension(length: string, theme?: Theme) {
  const match = LENGTH.exec(length.trim());
  if (match) return { value: Number(match[1]), unit: match[2] };
  const px = theme && /^(calc|var)\(/.test(length.trim()) ? lengthPx(theme, length) : undefined;
  return px === undefined ? undefined : { value: round(px), unit: "px" };
}

/** Lengths keyed by name as DTCG `dimension` tokens, leaving out those the format cannot hold. */
const dimensions = (lengths: Readonly<Record<string, string>>, theme?: Theme) =>
  Object.fromEntries(
    Object.entries(lengths).flatMap(([name, length]) => {
      const parsed = dimension(length, theme);
      return parsed ? [[name, value("dimension", parsed)]] : [];
    }),
  );

/** Numbers written as strings (shares, opacities, z-indices) as DTCG `number` tokens. */
const numbers = (record: Readonly<Record<string, string>>) =>
  Object.fromEntries(
    Object.entries(record).map(([name, share]) => [name, value("number", Number(share))]),
  );

/** The motion steps' easings as DTCG `cubicBezier` tokens, leaving out stepped easings. */
const easings = (theme: Theme) =>
  Object.fromEntries(
    Object.keys(theme.motion).flatMap((name) => {
      try {
        const { bezier } = motionTiming(theme, name);
        return bezier ? [[name, value("cubicBezier", [...bezier])]] : [];
      } catch {
        return [];
      }
    }),
  );

/** One shadow layer in DTCG's object form, or `undefined` when a part has no DTCG form (`var()`). */
function shadowLayer(layer: string) {
  const inset = /\binset\b/.test(layer);
  const colourText = /(oklch|rgb|hsl)\([^)]*\)|#[0-9a-f]{3,8}\b/i.exec(layer)?.[0];
  const lengths = layer
    .replace(colourText ?? "", "")
    .replace("inset", "")
    .trim()
    .split(/\s+/)
    .map((part) => dimension(part));
  if (colourText === undefined || lengths.length < 2 || lengths.includes(undefined))
    return undefined;
  const hex = colourText.startsWith("#")
    ? colourText
    : colourText.startsWith("oklch")
      ? oklchToHex(colourText)
      : undefined;
  if (hex === undefined) return undefined;
  const [offsetX, offsetY, blur = { value: 0, unit: "px" }, spread = { value: 0, unit: "px" }] =
    lengths;
  return { color: colour(colourText, hex), offsetX, offsetY, blur, spread, inset };
}

/** The theme's shadows of one mode as DTCG `shadow` tokens (a list of layers), leaving out any it cannot hold. */
const shadows = (theme: Theme, mode: "light" | "dark") =>
  Object.fromEntries(
    Object.entries(theme.shadows).flatMap(([name, token]) => {
      const css = token[mode].trim();
      if (css === "none") return [[name, value("shadow", [])]];
      const layers = css.split(/,(?![^(]*\))/).map((layer: string) => shadowLayer(layer.trim()));
      return layers.includes(undefined) ? [] : [[name, value("shadow", layers)]];
    }),
  );

/** The utility type scale and the named text styles as DTCG `typography` tokens. */
function typography(theme: Theme) {
  const font = (family: FontFamilyName) => families(fontStackOf(theme, family));
  const lineHeight = (size: number, height: string) =>
    /^[\d.]+$/.test(height) ? Number(height) : round((lengthPx(theme, height) ?? size) / size);
  const scale = Object.entries(theme.typeScale.sizes).flatMap(([name, step]) => {
    const size = dimension(step.size, theme);
    if (!size) return [];
    const px = lengthPx(theme, step.size) ?? 16;
    return [
      [
        name,
        value("typography", {
          fontFamily: font("sans"),
          fontSize: size,
          fontWeight: step.weight ?? 400,
          lineHeight: lineHeight(px, step.lineHeight),
          letterSpacing: dimension(step.tracking ?? "0px") ?? { value: 0, unit: "px" },
        }),
      ],
    ];
  });
  const styles = Object.entries(theme.typography).flatMap(([name, style]) => {
    const size = dimension(style.size);
    if (!size) return [];
    return [
      [
        name,
        value("typography", {
          fontFamily: font(style.family),
          fontSize: size,
          fontWeight: style.weight,
          lineHeight: lineHeight(size.value, style.lineHeight),
          ...(dimension(style.letterSpacing)
            ? { letterSpacing: dimension(style.letterSpacing) }
            : {}),
        }),
      ],
    ];
  });
  return { scale: Object.fromEntries(scale), style: Object.fromEntries(styles) };
}

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
    layout: {
      spacing: value("dimension", dimension(theme.layout.spacing, theme)),
      controlHeight: dimensions(theme.layout.controlHeight, theme),
      iconSize: dimensions(theme.layout.iconSize, theme),
      touchTarget: value("dimension", dimension(theme.layout.touchTarget, theme)),
      page: dimensions(
        {
          padding: theme.layout.page.padding,
          gutter: theme.layout.page.gutter,
          contentMaxWidth: theme.layout.page.contentMaxWidth,
        },
        theme,
      ),
      breakpoint: dimensions(theme.layout.breakpoints, theme),
      border: dimensions(
        { width: theme.layout.borderWidth, field: theme.layout.fieldBorderWidth },
        theme,
      ),
      focusRing: dimensions(
        { width: theme.layout.focusRing.width, offset: theme.layout.focusRing.offset },
        theme,
      ),
      size: dimensions(theme.layout.sizes, theme),
      state: numbers(theme.layout.state),
      opacity: numbers(theme.layout.opacity),
      zIndex: numbers(theme.layout.zIndex),
    },
    typography: typography(theme),
    shadow: { light: shadows(theme, "light"), dark: shadows(theme, "dark") },
    radius: dimensions({
      base: theme.radius.base,
      field: theme.radius.field,
      ...theme.radius.steps,
    }),
    duration: durations(theme),
    // The steps' easings and the named ones (ADR 0501); springs have no DTCG type and stay in the CSS and JSON exports.
    easing: {
      ...easings(theme),
      ...Object.fromEntries(
        Object.entries(theme.animation.easings).flatMap(([name, easing]) => {
          const bezier = easingBezier(easing);
          return bezier ? [[name, value("cubicBezier", [...bezier])]] : [];
        }),
      ),
    },
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
