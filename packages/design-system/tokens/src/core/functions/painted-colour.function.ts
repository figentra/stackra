/**
 * Stackra file contract:
 * Purpose: the colour a component paints for a CSS custom property name, in one scheme, as `web.css` over HeroUI's
 *          styles resolves it: the theme's palette entry of that name, else its colour role, else HeroUI's
 *          `color-mix(in oklab, …)` derivation evaluated the way CSS does (premultiplied alpha, percentages normalised
 *          when they do not sum to 100, the shortfall kept as alpha). `transparent` is clear black.
 * Boundary: pure; reads the tokens' `hexLight` and `hexDark`, so any CSS colour form the theme uses is measured as
 *           painted. A name nothing paints, a hex that does not parse or a derivation that loops gives `undefined`,
 *           never an exception.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 4: check what is painted); CSS Color 5 (`color-mix`).
 */
import type { DerivedColour } from "#contracts/types/derived-colour.type";
import type { PaintedColour } from "#contracts/types/painted-colour.type";
import type { ColorToken } from "#contracts/types/color-token.type";
import type { Theme } from "#contracts/types/theme.type";
import { HEROUI_DERIVED_COLOURS } from "#core/constants/heroui-derived-colours.constant";
import { oklabToSrgb } from "#core/functions/oklab-to-srgb.function";
import { srgbToOklab } from "#core/functions/srgb-to-oklab.function";

const HEX = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i;

/** A `#RRGGBB` or `#RRGGBBAA` hex as painted channels, or undefined when it is neither. */
function fromHex(hex: string): PaintedColour | undefined {
  const match = HEX.exec(hex);
  if (!match?.[1]) return undefined;
  const digits = match[1];
  const rgb = [0, 2, 4].map((at) => Number.parseInt(digits.slice(at, at + 2), 16)) as [
    number,
    number,
    number,
  ];
  return { rgb, alpha: match[2] === undefined ? 1 : Number.parseInt(match[2], 16) / 255 };
}

/** `color-mix(in oklab, one share%, two withShare%)`, as CSS Color 5 evaluates it. */
function mix(one: PaintedColour, share: number, two: PaintedColour, withShare: number) {
  const sum = share + withShare;
  if (sum <= 0) return undefined;
  const [p, q] = [share / sum, withShare / sum];
  const alpha = p * one.alpha + q * two.alpha;
  const shortfall = Math.min(sum, 100) / 100;
  if (alpha === 0) return { rgb: [0, 0, 0], alpha: 0 } satisfies PaintedColour;
  const [first, second] = [srgbToOklab(one.rgb), srgbToOklab(two.rgb)];
  const lab = first.map(
    (value, axis) => (p * one.alpha * value + q * two.alpha * (second[axis] ?? 0)) / alpha,
  ) as [number, number, number];
  return { rgb: oklabToSrgb(lab), alpha: alpha * shortfall } satisfies PaintedColour;
}

/** `name` painted in `mode`, with the derivations already being evaluated in `seen`, so a loop ends. */
function resolve(
  theme: Theme,
  name: string,
  mode: "light" | "dark",
  seen: ReadonlySet<string>,
): PaintedColour | undefined {
  if (name === "transparent") return { rgb: [0, 0, 0], alpha: 0 };
  const token: ColorToken | undefined =
    theme.palette[name] ?? (theme.colors as Readonly<Record<string, ColorToken>>)[name];
  if (token) return fromHex(mode === "light" ? token.hexLight : token.hexDark);
  const derived: DerivedColour | undefined = HEROUI_DERIVED_COLOURS[name]?.[mode];
  if (!derived || seen.has(name)) return undefined;
  const within = new Set([...seen, name]);
  const one = resolve(theme, derived.from, mode, within);
  const two = resolve(theme, derived.with, mode, within);
  if (!one || !two) return undefined;
  return mix(one, derived.share, two, derived.withShare ?? 100 - derived.share);
}

/**
 * The colour painted for `name` in `mode`.
 * @param theme - the theme whose stylesheet is loaded
 * @param name - a CSS custom property name without `--`: a palette entry, a role or a HeroUI derived colour
 * @param mode - the colour scheme
 * @returns the painted sRGB channels and alpha, or undefined when nothing paints the name
 */
export function paintedColour(
  theme: Theme,
  name: string,
  mode: "light" | "dark",
): PaintedColour | undefined {
  return resolve(theme, name, mode, new Set());
}
