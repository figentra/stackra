/**
 * Stackra file contract:
 * Purpose: ADR 0340 decision 4's suggestion: for a colour token that fails a contrast pair, the nearest oklch lightness
 *          per scheme, its chroma and hue kept, that clears every pair the colour takes part in, directly or through a
 *          colour HeroUI derives from it (the accent's soft fill and soft foreground move with the accent). A scheme
 *          that already passes keeps its value.
 * Boundary: pure; it suggests and never applies: the form shows "refused, try this". Contrast only, as the old engine's
 *           suggestion was; separation is a notice and is not suggested for. No passing lightness gives `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 4).
 */
import type { ContrastPair } from "#contracts/types/contrast-pair.type";
import type { ColorToken } from "#contracts/types/color-token.type";
import type { Theme } from "#contracts/types/theme.type";
import { DEFAULT_CONTRAST_PAIRS } from "#core/constants/default-contrast-pairs.constant";
import { HEROUI_DERIVED_COLOURS } from "#core/constants/heroui-derived-colours.constant";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";
import { pairRatio } from "#core/functions/pair-ratio.function";
import { paintedColour } from "#core/functions/painted-colour.function";
import { srgbToOklab } from "#core/functions/srgb-to-oklab.function";

const STEP = 0.005;
const OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*[\d.]+\s*)?\)$/i;

/** Whether the painted `name` changes when the token `target` does: it is the token, or HeroUI derives it from it. */
function dependsOn(
  theme: Theme,
  name: string,
  target: string,
  seen: ReadonlySet<string> = new Set(),
): boolean {
  if (name === target) return true;
  if (name in theme.palette || name in theme.colors || seen.has(name)) return false;
  const derived = HEROUI_DERIVED_COLOURS[name];
  if (!derived) return false;
  const within = new Set([...seen, name]);
  return [derived.light, derived.dark].some(
    (mix) =>
      dependsOn(theme, mix.from, target, within) || dependsOn(theme, mix.with, target, within),
  );
}

/** `theme` with the token at `group.name` set to `value` in `mode`, its hex recomputed. */
function withValue(
  theme: Theme,
  group: "colors" | "palette",
  name: string,
  mode: "light" | "dark",
  value: string,
): Theme {
  const token = (theme[group] as Readonly<Record<string, ColorToken>>)[name] as ColorToken;
  const next: ColorToken =
    mode === "light"
      ? { ...token, light: value, hexLight: oklchToHex(value) }
      : { ...token, dark: value, hexDark: oklchToHex(value) };
  return { ...theme, [group]: { ...theme[group], [name]: next } };
}

/**
 * The nearest colour for `path` that clears every pair it takes part in.
 * @param theme - the theme with the failing colour
 * @param path - `colors.<role>` or `palette.<name>`
 * @param pairs - the pairs to clear; the default role pairs when left out
 * @returns the suggested token, oklch with its hex; undefined when the path is not a colour or no lightness passes
 */
export function suggestColour(
  theme: Theme,
  path: string,
  pairs: readonly ContrastPair[] = DEFAULT_CONTRAST_PAIRS,
): ColorToken | undefined {
  const [group, name, ...rest] = path.split(".");
  if ((group !== "colors" && group !== "palette") || !name || rest.length > 0) return undefined;
  const token = (theme[group] as Readonly<Record<string, ColorToken>>)[name];
  if (!token) return undefined;
  const relevant = pairs.filter(
    (pair) =>
      name === "background" || dependsOn(theme, pair.fg, name) || dependsOn(theme, pair.bg, name),
  );
  const passes = (candidate: Theme, mode: "light" | "dark") =>
    relevant.every((pair) => (pairRatio(candidate, pair, mode) ?? 0) >= pair.min);
  const suggestion: Record<"light" | "dark", string> = { light: token.light, dark: token.dark };
  for (const mode of ["light", "dark"] as const) {
    if (passes(theme, mode)) continue;
    const painted = paintedColour(theme, name, mode);
    if (!painted) return undefined;
    // The token's own oklch keeps its chroma and hue exactly; another colour form is read back from what is painted.
    const own = OKLCH.exec(mode === "light" ? token.light : token.dark);
    const [paintedLightness, a, b] = srgbToOklab(painted.rgb);
    const lightness = own ? Number(own[1]) : paintedLightness;
    const chroma = own ? own[2] : Math.hypot(a, b).toFixed(3);
    const hue = own ? own[3] : (((Math.atan2(b, a) * 180) / Math.PI + 360) % 360).toFixed(1);
    let found: string | undefined;
    for (let step = 1; step * STEP <= 1 && found === undefined; step++)
      for (const candidate of [lightness - step * STEP, lightness + step * STEP]) {
        if (candidate < 0 || candidate > 1) continue;
        const alpha = painted.alpha < 1 ? ` / ${painted.alpha.toFixed(3)}` : "";
        const value = `oklch(${candidate.toFixed(3)} ${chroma} ${hue}${alpha})`;
        if (passes(withValue(theme, group, name, mode, value), mode)) {
          found = value;
          break;
        }
      }
    if (found === undefined) return undefined;
    suggestion[mode] = found;
  }
  return {
    light: suggestion.light,
    dark: suggestion.dark,
    hexLight: suggestion.light === token.light ? token.hexLight : oklchToHex(suggestion.light),
    hexDark: suggestion.dark === token.dark ? token.hexDark : oklchToHex(suggestion.dark),
  };
}
