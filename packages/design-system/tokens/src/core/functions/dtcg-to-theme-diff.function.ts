/**
 * Stackra file contract:
 * Purpose: `dtcgToThemeDiff`, the import side of the DTCG export (ADR 0501 section 5): a W3C Design Tokens tree in the
 *          shape `themeToDtcg` writes (from Figma variables or Style Dictionary) back to a theme diff, so a document
 *          can start from a design tool. Colours (oklch components or sRGB hex), spacing, radius and layout
 *          dimensions, numbers (state, opacity, z-index), durations and cubic-bezier easings come back.
 * Boundary: pure; reads only the groups and token types it knows and ignores the rest (typography and shadow
 *           composites stay CSS-authored). The diff is checked when it is applied (`mergeTheme`, `parseThemeDocument`).
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2); ADR 0340 (decision 7); W3C DTCG format (2025.10).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import type { ThemeDiff } from "#contracts/types/theme-diff.type";

type Tree = Readonly<Record<string, unknown>>;

const ROLES: ReadonlySet<string> = new Set(ColorRole);

const isRecord = (value: unknown): value is Tree =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The `$value` of a token of `type`, or `undefined`. */
const valueOf = (token: unknown, type: string): unknown =>
  isRecord(token) && token["$type"] === type ? token["$value"] : undefined;

/** A DTCG colour value as CSS and its hex. */
function cssColour(colour: unknown): { css: string; hex: string } | undefined {
  if (!isRecord(colour) || typeof colour["hex"] !== "string") return undefined;
  const components = colour["components"];
  const alpha = typeof colour["alpha"] === "number" ? colour["alpha"] : undefined;
  if (colour["colorSpace"] === "oklch" && Array.isArray(components) && components.length === 3) {
    const [l, c, h] = components as number[];
    return {
      css: `oklch(${l} ${c} ${h}${alpha === undefined ? "" : ` / ${alpha}`})`,
      hex: colour["hex"],
    };
  }
  return { css: colour["hex"], hex: colour["hex"] };
}

/** A DTCG dimension or duration as CSS (`12px`, `150ms`). */
const unitValue = (value: unknown): string | undefined =>
  isRecord(value) && typeof value["value"] === "number" && typeof value["unit"] === "string"
    ? `${value["value"]}${value["unit"]}`
    : undefined;

/** Every token of `type` in `group` mapped through `read`, dropping the unreadable ones. */
function each<Out>(group: unknown, type: string, read: (value: unknown) => Out | undefined) {
  if (!isRecord(group)) return undefined;
  const entries = Object.entries(group).flatMap(([name, token]) => {
    const out = read(valueOf(token, type));
    return out === undefined ? [] : [[name, out] as const];
  });
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

/** A DTCG number as the string the theme stores. */
const number = (value: unknown) => (typeof value === "number" ? String(value) : undefined);

/** The theme diff a DTCG tree describes. */
export function dtcgToThemeDiff(tree: unknown): ThemeDiff {
  if (!isRecord(tree)) return {};
  const color = isRecord(tree["color"]) ? tree["color"] : {};
  const light = isRecord(color["light"]) ? color["light"] : {};
  const dark = isRecord(color["dark"]) ? color["dark"] : {};
  const colours = Object.fromEntries(
    Object.keys(light).flatMap((name) => {
      const day = cssColour(valueOf(light[name], "color"));
      const night = cssColour(valueOf(dark[name], "color")) ?? day;
      return day && night
        ? [[name, { light: day.css, dark: night.css, hexLight: day.hex, hexDark: night.hex }]]
        : [];
    }),
  );
  const layout = isRecord(tree["layout"]) ? tree["layout"] : {};
  const dimension = (token: unknown) => unitValue(valueOf(token, "dimension"));
  const motion = each(tree["duration"], "duration", unitValue);
  const easing = isRecord(tree["easing"]) ? tree["easing"] : {};
  const diff = {
    // A colour named like a role is a role; any other is a palette step.
    colors: Object.fromEntries(Object.entries(colours).filter(([name]) => ROLES.has(name))),
    palette: Object.fromEntries(Object.entries(colours).filter(([name]) => !ROLES.has(name))),
    ...(isRecord(tree["space"]) ? { spacing: each(tree["space"], "dimension", unitValue) } : {}),
    ...(isRecord(tree["radius"])
      ? (() => {
          const { base, field, ...steps } = each(tree["radius"], "dimension", unitValue) ?? {};
          return { radius: { base, field, steps } };
        })()
      : {}),
    layout: {
      spacing: dimension(layout["spacing"]),
      touchTarget: dimension(layout["touchTarget"]),
      controlHeight: each(layout["controlHeight"], "dimension", unitValue),
      iconSize: each(layout["iconSize"], "dimension", unitValue),
      breakpoints: each(layout["breakpoint"], "dimension", unitValue),
      sizes: each(layout["size"], "dimension", unitValue),
      state: each(layout["state"], "number", number),
      opacity: each(layout["opacity"], "number", number),
      zIndex: each(layout["zIndex"], "number", number),
    },
    ...(motion
      ? {
          motion: Object.fromEntries(
            Object.entries(motion).map(([name, duration]) => {
              const points = valueOf(easing[name], "cubicBezier");
              return [
                name,
                {
                  duration,
                  ...(Array.isArray(points) && points.length === 4
                    ? { easing: `cubic-bezier(${points.join(", ")})` }
                    : {}),
                },
              ];
            }),
          ),
        }
      : {}),
  };
  return prune(diff) as ThemeDiff;
}

/** `value` without its `undefined` leaves and the records they leave empty. */
function prune(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const kept = Object.entries(value).flatMap(([key, child]) => {
    const pruned = prune(child);
    return pruned === undefined || (isRecord(pruned) && Object.keys(pruned).length === 0)
      ? []
      : [[key, pruned]];
  });
  return Object.fromEntries(kept);
}
