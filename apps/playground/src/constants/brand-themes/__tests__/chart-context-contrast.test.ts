/**
 * Stackra file contract:
 * Purpose: the chart context tone in every shipped brand theme, measured as the charts paint it: each brand ×
 *          light/dark × chart colour (the categorical set, the accent ramp, the accent and status colours). A context
 *          mark is a soft fill (`CHART_CONTEXT_SHARE` of the colour in OKLab, the rest the card's surface) edged in
 *          the field border. Asserts the edge holds 3:1 on the card (WCAG 1.4.11: the boundary contrasts, not the
 *          fill), and prints how far the emphasised fill stands from the context fill, asserting 1.5:1 or more for
 *          the Stackra theme's accent in light, where the hero speaks through it.
 * Boundary: pure; no DOM. The mix is CSS Color 5's `color-mix(in oklab, …)` of two opaque colours.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0340 (decision 9); WCAG 2.2 (1.4.11); STA-1371.
 */
import { contrastRatio, oklabToSrgb, paintedColour, srgbToOklab } from "@stackra/tokens";
import { CHART_CONTEXT_SHARE, chartRampOf } from "@stackra/ui";

import { BRAND_THEMES, buildBrandTheme } from "#src/constants/brand-themes";

type Rgb = [number, number, number];

const hexOf = (rgb: readonly number[]) =>
  `#${rgb.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
const rgbOf = (hex: string) =>
  [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16)) as Rgb;

/** `color-mix(in oklab, one share, two)` of opaque colours. */
function mix(one: Rgb, share: number, two: Rgb): Rgb {
  const [first, second] = [srgbToOklab(one), srgbToOklab(two)];
  return oklabToSrgb(
    first.map((value, axis) => value * share + (second[axis] ?? 0) * (1 - share)) as Rgb,
  );
}

const NAMED = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "accent",
  "success",
  "warning",
  "danger",
];

const rows = BRAND_THEMES.flatMap(({ id, layer }) => {
  const theme = buildBrandTheme(layer);
  return (["light", "dark"] as const).flatMap((mode) => {
    const painted = (name: string) => paintedColour(theme, name, mode);
    const rgb = (name: string) => rgbOf(hexOf(painted(name)?.rgb ?? [0, 0, 0]));
    const surface = rgb("surface");
    // The field border over the card, as the browser composites a translucent one.
    const border = painted("field-border") ?? { rgb: [0, 0, 0], alpha: 1 };
    const edge = border.rgb.map(
      (c, at) => c * border.alpha + (surface[at] ?? 0) * (1 - border.alpha),
    );
    const colours = [
      ...NAMED.map((name) => [name, rgb(name)] as const),
      ...chartRampOf(rgb("accent"), mode).map(
        (hex, at) => [`chart-ramp-${at + 1}`, rgbOf(hex)] as const,
      ),
    ];
    return colours.map(([name, colour]) => {
      const soft = mix(colour, CHART_CONTEXT_SHARE, surface);
      return {
        id,
        mode,
        name,
        edge: contrastRatio(hexOf(edge), hexOf(surface)),
        apart: contrastRatio(hexOf(colour), hexOf(soft)),
      };
    });
  });
});

describe("chart context tone", () => {
  it("prints the table", () => {
    const lines = rows.map(
      ({ id, mode, name, edge, apart }) =>
        `${id.padEnd(9)} ${mode.padEnd(5)} ${name.padEnd(13)} edge ${edge.toFixed(2).padStart(5)}  emphasis apart ${apart.toFixed(2).padStart(5)}`,
    );
    console.log(`\n${lines.join("\n")}\n`);
    expect(lines.length).toBe(BRAND_THEMES.length * 2 * (NAMED.length + 5));
  });

  it.each(rows.map((row) => [`${row.id} ${row.mode} ${row.name}`, row] as const))(
    "%s context edge holds 3:1 on the card",
    (_, { edge }) => {
      expect(edge).toBeGreaterThanOrEqual(3);
    },
  );

  it("keeps the Stackra accent's emphasis 1.5:1 or more from its context in light", () => {
    const row = rows.find((r) => r.id === "stackra" && r.mode === "light" && r.name === "accent");
    expect(row?.apart).toBeGreaterThanOrEqual(1.5);
  });
});
