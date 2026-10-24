/**
 * Stackra file contract:
 * Purpose: proves the stackra theme carries the approved brand kit, as amended by ADR 0319.
 *          - Its colours equal the kit's resolved tokens, bar the steel-blue accent family ADR 0319 sets.
 *          - Every pairing the kit's contrast report holds to a WCAG minimum still meets it, the amended ones too.
 *          - The rest of the accent family (link, signal) stays achromatic, and the amended steps are steel blue.
 *          - Every hex is the sRGB of its oklch.
 *          - The fonts moved with the theme beside their OFL licences.
 * Boundary: reads the kit reports and fonts in assets/; computes contrast from the oklch values through sRGB, which
 *          is how the kit's contrast report was computed (it matches to 0.005).
 * Runtime: node
 * Governing contract: ADR 0302; ADR 0024 (fonts keep the SIL OFL); ADR 0022 (test placement).
 */
import { existsSync, readFileSync } from "node:fs";

import type { ColorToken } from "#contracts/types/theme.type";
import { MATERIAL_MODES } from "#core/constants/material-modes.constant";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { contrastRatio } from "#core/functions/contrast-ratio.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";

const assets = new URL("../../../../assets/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, assets), "utf8");
const kit = <T>(name: string) => JSON.parse(read(`data/stackra/${name}.json`)) as T;
type Mode = "light" | "dark";

const tokenOf = (name: string): ColorToken | undefined =>
  (STACKRA_THEME.colors as Readonly<Record<string, ColorToken>>)[name] ??
  STACKRA_THEME.palette[name];

/** The WCAG ratio of two oklch colours as a browser paints them: through their 8-bit sRGB. */
const contrast = (one: string, two: string) => contrastRatio(oklchToHex(one), oklchToHex(two));

/** The tokens ADR 0319 moves off the kit's neutral accent onto the brand's steel blue. */
const STEEL_ACCENT = new Set([
  "accent",
  "accent-hover",
  "accent-pressed",
  "accent-soft",
  "accent-soft-foreground",
  "focus",
]);

// The kit labels the modes "base" and "dark".
const modeOf = (theme: string): Mode => (theme === "dark" ? "dark" : "light");

const channels = (hex: string) => [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));

/** `top` at `alpha` over the opaque `bottom`, as a browser composites them: in 8-bit sRGB. */
const over = (top: string, alpha: number, bottom: string) =>
  `#${channels(top)
    .map((value, index) => Math.round(value * alpha + (channels(bottom)[index] ?? 0) * (1 - alpha)))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;

const lch = (oklch: string) =>
  oklch.slice(6, -1).split(" ").map(Number) as [number, number, number];

/**
 * `color-mix(in oklch, <one at alpha a>, <opaque two> t)` as CSS computes it: lightness and chroma premultiplied by
 * alpha, the hue along the shorter arc, and a powerless hue (no chroma) taking the other colour's.
 * @returns the mixed colour as an oklch string, and its alpha
 */
function mixInOklch(one: string, a: number, two: string, t: number): [string, number] {
  const [l1, c1, h1] = lch(one);
  const [l2, c2, h2] = lch(two);
  const alpha = (1 - t) * a + t;
  const lightness = ((1 - t) * a * l1 + t * l2) / alpha;
  const chroma = ((1 - t) * a * c1 + t * c2) / alpha;
  const delta = ((((h2 - h1) % 360) + 540) % 360) - 180;
  const hue = c1 < 1e-6 ? h2 : c2 < 1e-6 ? h1 : (h1 + delta * t + 360) % 360;
  return [`oklch(${lightness} ${chroma} ${hue})`, alpha];
}

// @covers sta-350:FR-002 sta-350:FR-020
describe("STACKRA_THEME", () => {
  it("is named stackra", () => {
    expect(STACKRA_THEME.name).toBe("stackra");
  });

  it("defines h4 to h6 and their Arabic twins (ADR 0303 decision 9)", () => {
    const { typography } = STACKRA_THEME;
    const pick = (name: string) => {
      const style = typography[name];
      return style && [style.size, style.lineHeight, style.weight, style.letterSpacing];
    };
    expect(pick("h4")).toEqual(["18px", "1.4", 600, "-0.01em"]);
    expect(pick("h5")).toEqual(["16px", "1.5", 600, "0em"]);
    expect(pick("h6")).toEqual(["14px", "1.5", 600, "0em"]);
    // One pixel and 0.2 of line height above the Latin style, in the Arabic family.
    expect(pick("h4-ar")).toEqual(["19px", "1.6", 600, "0em"]);
    expect(pick("h5-ar")).toEqual(["17px", "1.7", 600, "0em"]);
    expect(pick("h6-ar")).toEqual(["15px", "1.7", 600, "0em"]);
    expect(typography["h4-ar"]?.family).toBe("arabic");
  });

  it("carries the kit's resolved colours unchanged", () => {
    const resolved = kit<{
      tokens: {
        name: string;
        light: { value: string; hex: string };
        dark: { value: string; hex: string };
      }[];
    }>("resolved").tokens;
    expect(resolved.length).toBeGreaterThan(20);
    for (const token of resolved.filter(({ name }) => !STEEL_ACCENT.has(name)))
      expect(tokenOf(token.name), token.name).toEqual({
        light: token.light.value,
        dark: token.dark.value,
        hexLight: token.light.hex,
        hexDark: token.dark.hex,
      });
  });

  it("derives every hex from its oklch value", () => {
    for (const [name, token] of Object.entries({
      ...STACKRA_THEME.colors,
      ...STACKRA_THEME.palette,
    }))
      expect([token.hexLight, token.hexDark], name).toEqual([
        oklchToHex(token.light),
        oklchToHex(token.dark),
      ]);
    // Values the kit's resolved report once disagreed with, as Chromium paints them.
    expect(STACKRA_THEME.colors.surface.hexDark).toBe("#131518");
    expect(STACKRA_THEME.colors.success.hexLight).toBe("#40731A");
  });

  it("meets every WCAG minimum in the kit's contrast report", () => {
    const rows = kit<
      {
        foreground: string;
        background: string;
        theme: string;
        minimum: number | null;
        ratio: number;
      }[]
    >("contrast").filter((row) => row.minimum !== null);
    expect(rows.length).toBeGreaterThan(80);
    for (const row of rows) {
      const mode = modeOf(row.theme);
      const ratio = contrast(
        tokenOf(row.foreground)?.[mode] ?? "",
        tokenOf(row.background)?.[mode] ?? "",
      );
      const pair = `${row.theme} ${row.foreground} on ${row.background}`;
      expect(ratio, pair).toBeGreaterThanOrEqual(row.minimum ?? 0);
      // An amended token keeps the kit's minimum, not the kit's exact ratio.
      if (!STEEL_ACCENT.has(row.foreground) && !STEEL_ACCENT.has(row.background))
        expect(Math.abs(ratio - row.ratio), pair).toBeLessThan(0.01);
    }
  });

  it("keeps the rest of the accent family achromatic (oklch chroma below 0.02), as the kit's separation report records", () => {
    const rows = kit<{ neutrality: { theme: string; name: string; hex: string }[] }>(
      "separation",
    ).neutrality;
    expect(rows.length).toBeGreaterThan(10);
    for (const row of rows.filter(({ name }) => !STEEL_ACCENT.has(name))) {
      const mode = modeOf(row.theme);
      const token = tokenOf(row.name);
      const chroma = Number(token?.[mode].match(/oklch\([\d.]+ ([\d.]+)/)?.[1]);
      expect(chroma, row.name).toBeLessThan(0.02);
      expect(mode === "dark" ? token?.hexDark : token?.hexLight, row.name).toBe(row.hex);
    }
  });

  // @covers sta-425:FR-001 sta-425:P-001
  it("gives the accent the brand's steel blue, with paper or ink on it at 4.5:1 or more (ADR 0319)", () => {
    for (const name of STEEL_ACCENT) {
      const token = tokenOf(name);
      for (const mode of ["light", "dark"] as const) {
        const [, chroma, hue] =
          token?.[mode].match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/)?.slice(1) ?? [];
        expect(Number(hue), `${name} ${mode}`).toBe(248);
        expect(Number(chroma), `${name} ${mode}`).toBeGreaterThanOrEqual(0.03);
      }
    }
    const { accent, "accent-foreground": on, background } = STACKRA_THEME.colors;
    expect(contrastRatio(on.hexLight, accent.hexLight)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(on.hexDark, accent.hexDark)).toBeGreaterThanOrEqual(4.5);
    // The focus ring stands 3:1 from the page in both modes (WCAG 2.2 SC 1.4.11).
    expect(
      contrastRatio(STACKRA_THEME.colors.focus.hexLight, background.hexLight),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(STACKRA_THEME.colors.focus.hexDark, background.hexDark),
    ).toBeGreaterThanOrEqual(3);
  });

  // @covers sta-350:FR-005
  it("ships its fonts: every @font-face file exists beside its OFL licence", () => {
    const css = read("public/fonts/fonts.css");
    const files = [...css.matchAll(/url\("\.\/([^"]+)"\)/g)].map((match) => match[1]);
    expect(files).toHaveLength(10);
    for (const file of [...files, "OFL-Geist.txt", "OFL-IBMPlexSansArabic.txt"])
      expect(existsSync(new URL(`public/fonts/${file}`, assets)), file).toBe(true);
    for (const family of ["Geist", "Geist Mono", "IBM Plex Sans Arabic"])
      expect(css).toContain(`font-family: "${family}";`);
  });

  // ADR 0320 decision 4: reading text on the regular and thick levels holds 4.5:1 over the worst backdrops, pure black
  // and pure white, in every mode and scheme, with liquid's sheen laid at full strength over the fill. The thin level
  // carries no reading text, so it is not held to this.
  it("keeps reading text at 4.5:1 on the regular and thick material over black and white, in every mode", () => {
    const failures: string[] = [];
    for (const mode of ["light", "dark"] as const) {
      const surface = oklchToHex(STACKRA_THEME.colors.surface[mode]);
      const text = oklchToHex(STACKRA_THEME.colors.foreground[mode]);
      for (const level of ["regular", "thick"] as const) {
        const share = STACKRA_THEME.materials.levels[level].fill[mode];
        for (const [name, factors] of Object.entries(MATERIAL_MODES)) {
          const fill = Math.min(1, Math.max(factors.fillFloor, share * factors.fillScale));
          const sheen = factors.sheen * STACKRA_THEME.materials.highlight[mode];
          for (const backdrop of ["#000000", "#ffffff"]) {
            const ground = over("#ffffff", sheen, over(surface, fill, backdrop));
            const ratio = contrastRatio(text, ground);
            if (ratio < 4.5)
              failures.push(`${mode} ${level} ${name} over ${backdrop}: ${ratio.toFixed(2)}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  // ADR 0319 decision 2: a quiet button sits on the control fill (the thick level, floored at the frosted mode's
  // floor), and its labels hold 4.5:1 over pure black and pure white at rest, on hover (8% of foreground) and pressed
  // (12%), in every mode and scheme. The tints are color-mix in oklch, so they are mixed that way here.
  // @covers sta-425:FR-002
  it("keeps quiet button labels at 4.5:1 on the control fill at rest, hover and press, over black and white", () => {
    const failures: string[] = [];
    for (const mode of ["light", "dark"] as const) {
      const surface = STACKRA_THEME.colors.surface[mode];
      const foreground = STACKRA_THEME.colors.foreground[mode];
      const labels = ["default-foreground", "accent-soft-foreground"].map(
        (role) => tokenOf(role)?.[mode] ?? "",
      );
      const share = STACKRA_THEME.materials.levels.thick.fill[mode];
      for (const [name, factors] of Object.entries(MATERIAL_MODES)) {
        const floor = Math.max(factors.fillFloor, MATERIAL_MODES.frosted.fillFloor);
        const fill = Math.min(1, Math.max(floor, share * factors.fillScale));
        for (const tint of [0, 0.08, 0.12]) {
          const [color, alpha] = mixInOklch(surface, fill, foreground, tint);
          for (const backdrop of ["#000000", "#ffffff"]) {
            const ground = over(oklchToHex(color), alpha, backdrop);
            for (const label of labels) {
              const ratio = contrastRatio(oklchToHex(label), ground);
              if (ratio < 4.5)
                failures.push(
                  `${mode} ${name} ${tint * 100}% over ${backdrop}, ${label}: ${ratio.toFixed(2)}`,
                );
            }
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
