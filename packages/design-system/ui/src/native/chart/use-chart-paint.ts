/**
 * Stackra file contract:
 * Purpose: `useChartPaint`, the theme's values for a chart's series colours and its quiet chrome, read live from
 *          Uniwind's `--color-<name>` variables so a brand or scheme change repaints: the accent ramp
 *          (`chart-ramp-<n>`, a theme's own step if it defines one, else derived from the accent with `chartRampOf`),
 *          the categorical and status colours, the muted ticks, a grid and track of the muted colour at 15%, the bar
 *          cursor's foreground at 5%, the surface for rings and slice gaps, and the marks' top light from the
 *          material highlight share.
 * Boundary: a React hook over `useCSSVariable` (what heroui-native's useThemeColor reads) and Skia's colour parser;
 *           no colour is written here, only derived from the theme.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9); STA-1371.
 */
import { Skia } from "@shopify/react-native-skia";
import { use } from "react";
import { useCSSVariable } from "uniwind";

import type { ChartColor } from "#contracts/enums/chart-color.enum";
import { chartRampOf } from "#core/functions/chart-ramp-of.function";
import { alphaOf } from "#native/chart/alpha-of.function";
import type { ChartPaint } from "#native/chart/chart-paint.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";

/** The roles the chrome reads, then the five ramp overrides a theme may define. */
const ROLES = ["muted", "foreground", "surface", "accent", "field-border"] as const;
const RAMP = [
  "chart-ramp-1",
  "chart-ramp-2",
  "chart-ramp-3",
  "chart-ramp-4",
  "chart-ramp-5",
] as const;

/** The theme values of `colors` and the chart chrome. */
export function useChartPaint(colors: readonly ChartColor[]): ChartPaint {
  const names = [...ROLES, ...RAMP, ...colors].map((name) => `--color-${name}`);
  const [share, ...read] = useCSSVariable(["--material-highlight-share", ...names]);
  const values = read.map((value) => (value === undefined ? undefined : String(value)));
  // The theme's native CSS writes the share per scheme (renderNativeCss), so a flat brand (0) draws flat; a stylesheet
  // generated before it did leaves it unset, which lights the marks as the Stackra theme does.
  const lift = share === undefined ? 1 : Math.min(1, Math.max(0, Number(share) * 10 || 0));
  const scheme = use(DesignSystemContext)?.resolvedColorScheme === "dark" ? "dark" : "light";
  const [muted = "", foreground = "", surface = "", accent = "", fieldBorder = ""] =
    values as string[];
  // oxlint-disable-next-line react/capitalized-calls -- Skia.Color is Skia's colour parser, a namespace method, not a component
  const [red = 0, green = 0, blue = 0] = Skia.Color(accent || "transparent");
  const derived = chartRampOf([red * 255, green * 255, blue * 255], scheme);
  const ramp = RAMP.map((_, index) => values[ROLES.length + index] ?? derived[index] ?? accent);
  const series = colors.map((color, index) => {
    const step = RAMP.indexOf(color as (typeof RAMP)[number]);
    return step === -1
      ? (values[ROLES.length + RAMP.length + index] ?? "transparent")
      : (ramp[step] ?? accent);
  });
  return {
    series,
    muted,
    foreground,
    surface,
    fieldBorder,
    grid: alphaOf(muted, 0.15),
    cursorBlock: alphaOf(foreground, 0.05),
    lift,
  };
}
