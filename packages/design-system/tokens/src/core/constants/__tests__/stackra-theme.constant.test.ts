/**
 * Stackra file contract:
 * Purpose: proves the stackra theme carries the approved brand kit, as amended by ADR 0319, ADR 0340 and ADR 0463.
 *          - Its colours equal a frozen in-code snapshot of the kit's resolved tokens (ADR 0340 decision 8), with the
 *            neutral steel accent family of ADR 0463 (brand rules §31), the neutral `amber-strong` name and decision
 *            9's banner and chart tokens; a change to any colour changes the snapshot on purpose.
 *          - Every pair in `STACKRA_CONTRAST_PAIRS` (the kit's WCAG minimums, moved into code) holds in both schemes.
 *          - The link, the signal and the accent's label stay achromatic, and the amended steps are neutral steel
 *            (hue 252, chroma 0.03 or less) with the brand's hex values.
 *          - The banners stand apart from the status colours; the accent, being near grey, carries no hue a status
 *            could be read as (ADR 0463 decision 2).
 *          - Every hex is the sRGB of its oklch.
 *          - The fonts moved with the theme beside their OFL licences; the headings are set in the display stacks,
 *            which default to sans and arabic (STA-1386).
 * Boundary: in-memory theme, and the fonts in assets/public/fonts; contrast is computed from the oklch values through
 *          sRGB, as the kit's contrast report was.
 * Runtime: node
 * Governing contract: ADR 0302; ADR 0340 (decisions 8 and 9); ADR 0463; ADR 0024 (fonts keep the SIL OFL); ADR 0022 (test
 *          placement).
 */
import { existsSync, readFileSync } from "node:fs";

import type { ColorToken } from "#contracts/types/color-token.type";
import { MATERIAL_MODES } from "#core/constants/material-modes.constant";
import { STACKRA_CONTRAST_PAIRS } from "#core/constants/stackra-contrast-pairs.constant";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { checkSeparation } from "#core/functions/check-separation.function";
import { checkTheme } from "#core/functions/check-theme.function";
import { contrastRatio } from "#core/functions/contrast-ratio.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";

const assets = new URL("../../../../assets/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, assets), "utf8");

const tokenOf = (name: string): ColorToken | undefined =>
  (STACKRA_THEME.colors as Readonly<Record<string, ColorToken>>)[name] ??
  STACKRA_THEME.palette[name];

/** The tokens ADR 0319 moved off the kit's neutral accent, which ADR 0463 sets to the brand's neutral steel. */
const STEEL_ACCENT = new Set([
  "accent",
  "accent-hover",
  "accent-pressed",
  "accent-soft",
  "accent-soft-foreground",
  "focus",
]);

/** The accent family members the kit's separation report holds achromatic, which ADR 0319 and 0463 leave so. */
const ACHROMATIC = ["accent-foreground", "link", "signal", "signal-foreground"];

/**
 * Every colour of the stackra theme, light then dark, frozen (ADR 0340 decision 8): the kit's resolved tokens with the
 * amendments of ADR 0463 (the neutral steel accent, superseding ADR 0319 decision 1), the owner's light muted 0.49 (2026-10-23), HeroUI's warning hover fix and
 * ADR 0340 (`amber-strong`, the banners and the charts).
 */
const SNAPSHOT: Readonly<
  Record<"colors" | "palette", Readonly<Record<string, readonly [string, string]>>>
> = {
  colors: {
    background: ["oklch(0.972 0.004 122)", "oklch(0.158 0.005 248)"],
    foreground: ["oklch(0.158 0.005 248)", "oklch(0.972 0.004 122)"],
    surface: ["oklch(1 0 0)", "oklch(0.195 0.006 250)"],
    "surface-foreground": ["oklch(0.158 0.005 248)", "oklch(0.972 0.004 122)"],
    "surface-secondary": ["oklch(0.955 0.004 110)", "oklch(0.235 0.007 250)"],
    "surface-secondary-foreground": ["oklch(0.158 0.005 248)", "oklch(0.972 0.004 122)"],
    "surface-tertiary": ["oklch(0.935 0.004 110)", "oklch(0.285 0.007 250)"],
    "surface-tertiary-foreground": ["oklch(0.158 0.005 248)", "oklch(0.972 0.004 122)"],
    overlay: ["oklch(1 0 0)", "oklch(0.215 0.006 250)"],
    "overlay-foreground": ["oklch(0.158 0.005 248)", "oklch(0.972 0.004 122)"],
    muted: ["oklch(0.49 0.01 250)", "oklch(0.72 0.008 250)"],
    default: ["oklch(0.935 0.004 110)", "oklch(0.285 0.007 250)"],
    "default-foreground": ["oklch(0.158 0.005 248)", "oklch(0.972 0.004 122)"],
    accent: ["oklch(0.546 0.03 252)", "oklch(0.77 0.03 252)"],
    "accent-foreground": ["oklch(0.972 0.004 122)", "oklch(0.158 0.005 248)"],
    success: ["oklch(0.5 0.13 135)", "oklch(0.72 0.15 135)"],
    "success-foreground": ["oklch(1 0 0)", "oklch(0.158 0.005 248)"],
    warning: ["oklch(0.55 0.15 47)", "oklch(0.72 0.17 47)"],
    "warning-foreground": ["oklch(1 0 0)", "oklch(0.158 0.005 248)"],
    danger: ["oklch(0.45 0.17 24)", "oklch(0.66 0.2 22)"],
    "danger-foreground": ["oklch(1 0 0)", "oklch(0.158 0.005 248)"],
    "field-background": ["oklch(1 0 0)", "oklch(0.235 0.007 250)"],
    "field-foreground": ["oklch(0.158 0.005 248)", "oklch(0.972 0.004 122)"],
    "field-placeholder": ["oklch(0.49 0.01 250)", "oklch(0.72 0.008 250)"],
    "field-border": ["oklch(0.6 0.008 250)", "oklch(0.56 0.008 250)"],
    segment: ["oklch(1 0 0)", "oklch(0.38 0.009 248)"],
    "segment-foreground": ["oklch(0.158 0.005 248)", "oklch(0.972 0.004 122)"],
    border: ["oklch(0.885 0.005 110)", "oklch(0.35 0.008 250)"],
    separator: ["oklch(0.92 0.004 110)", "oklch(0.27 0.007 250)"],
    focus: ["oklch(0.546 0.03 252)", "oklch(0.77 0.03 252)"],
    link: ["oklch(0.158 0.005 248)", "oklch(0.972 0.004 122)"],
    backdrop: ["oklch(0.158 0.005 248 / 0.4)", "oklch(0.08 0.004 248 / 0.6)"],
  },
  palette: {
    amber: ["oklch(0.83 0.15 82)", "oklch(0.83 0.15 82)"],
    ink: ["oklch(0.158 0.005 248)", "oklch(0.158 0.005 248)"],
    paper: ["oklch(0.972 0.004 122)", "oklch(0.972 0.004 122)"],
    white: ["oklch(1 0 0)", "oklch(1 0 0)"],
    steel: ["oklch(0.931 0.012 248)", "oklch(0.931 0.012 248)"],
    "steel-deep": ["oklch(0.24 0.015 248.4)", "oklch(0.24 0.015 248.4)"],
    "stk-tile": ["oklch(1 0 89.9)", "oklch(0.234 0.007 258.4)"],
    "stk-tile-line": ["oklch(0.839 0.007 124.5)", "oklch(0.35 0.009 248.1)"],
    "stk-ink": ["oklch(0.24 0.015 248.4)", "oklch(0.931 0.012 248)"],
    "graphite-100": ["oklch(0.925 0.006 248)", "oklch(0.925 0.006 248)"],
    "graphite-200": ["oklch(0.87 0.007 248)", "oklch(0.87 0.007 248)"],
    "graphite-300": ["oklch(0.8 0.008 248)", "oklch(0.8 0.008 248)"],
    "graphite-700": ["oklch(0.38 0.009 248)", "oklch(0.38 0.009 248)"],
    "graphite-800": ["oklch(0.3 0.009 248)", "oklch(0.3 0.009 248)"],
    "graphite-900": ["oklch(0.265 0.008 248)", "oklch(0.265 0.008 248)"],
    "accent-hover": ["oklch(0.5 0.03 252)", "oklch(0.72 0.03 252)"],
    "accent-pressed": ["oklch(0.45 0.03 252)", "oklch(0.67 0.03 252)"],
    "accent-soft": ["oklch(0.94 0.012 252)", "oklch(0.29 0.015 252)"],
    "accent-soft-foreground": ["oklch(0.4 0.03 252)", "oklch(0.88 0.02 252)"],
    signal: ["oklch(0.158 0.005 248)", "oklch(0.972 0.004 122)"],
    "signal-foreground": ["oklch(0.972 0.004 122)", "oklch(0.158 0.005 248)"],
    "amber-strong": ["oklch(0.47 0.095 75)", "oklch(0.83 0.15 82)"],
    "warning-hover": ["oklch(0.5 0.15 47)", "oklch(0.67 0.17 47)"],
    "banner-sandbox": ["oklch(0.5 0.08 190)", "oklch(0.72 0.11 190)"],
    "banner-sandbox-foreground": ["oklch(1 0 0)", "oklch(0.158 0.005 248)"],
    "banner-staging": ["oklch(0.5 0.16 300)", "oklch(0.72 0.13 300)"],
    "banner-staging-foreground": ["oklch(1 0 0)", "oklch(0.158 0.005 248)"],
    "banner-acting-as": ["oklch(0.5 0.17 350)", "oklch(0.72 0.15 350)"],
    "banner-acting-as-foreground": ["oklch(1 0 0)", "oklch(0.158 0.005 248)"],
    "chart-1": ["oklch(0.55 0.12 248)", "oklch(0.72 0.11 248)"],
    "chart-2": ["oklch(0.6 0.1 185)", "oklch(0.78 0.11 185)"],
    "chart-3": ["oklch(0.52 0.16 300)", "oklch(0.7 0.14 300)"],
    "chart-4": ["oklch(0.62 0.15 55)", "oklch(0.78 0.14 60)"],
    "chart-5": ["oklch(0.55 0.17 355)", "oklch(0.72 0.15 355)"],
  },
};

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
    expect(typography["h4-ar"]?.family).toBe("displayArabic");
  });

  // @covers sta-1386
  it("sets the headings in the display stacks and leaves them to their sans and arabic defaults", () => {
    const { typography, fontFamily } = STACKRA_THEME;
    for (const name of ["display", "h1", "h2", "h3", "h4", "h5", "h6"]) {
      expect(typography[name]?.family, name).toBe("display");
      expect(typography[`${name}-ar`]?.family, `${name}-ar`).toBe("displayArabic");
    }
    for (const name of ["body", "small", "caption"]) {
      expect(typography[name]?.family, name).toBe("sans");
      expect(typography[`${name}-ar`]?.family, `${name}-ar`).toBe("arabic");
    }
    expect(Object.keys(fontFamily)).toEqual(["sans", "mono", "arabic"]);
  });

  // @covers sta-348:FR-004
  it("holds every colour to the frozen snapshot", () => {
    for (const group of ["colors", "palette"] as const)
      expect(
        Object.fromEntries(
          Object.entries(STACKRA_THEME[group]).map(([name, token]) => [
            name,
            [token.light, token.dark],
          ]),
        ),
        group,
      ).toEqual(SNAPSHOT[group]);
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

  // @covers sta-348:FR-004 sta-348:FR-005
  it("meets every pair of STACKRA_CONTRAST_PAIRS in both schemes, as painted", () => {
    expect(checkTheme(STACKRA_THEME, STACKRA_CONTRAST_PAIRS)).toEqual([]);
  });

  it("keeps the accent's label, the link and the signal achromatic (oklch chroma below 0.02)", () => {
    for (const name of ACHROMATIC)
      for (const mode of ["light", "dark"] as const) {
        const chroma = Number(tokenOf(name)?.[mode].match(/oklch\([\d.]+ ([\d.]+)/)?.[1]);
        expect(chroma, `${name} ${mode}`).toBeLessThan(0.02);
      }
  });

  // @covers sta-348:FR-005
  // ADR 0463 decision 2: the neutral steel accent sits at the grey edge (chroma 0.03), where ADR 0340 decision 5 reads
  // no hue, so it is no longer a separation subject; it carries no hue a status could be mistaken for.
  it("draws the environment banners apart from the status colours (ADR 0340 decision 9)", () => {
    const banners = ["banner-sandbox", "banner-staging", "banner-acting-as"];
    for (const name of banners) {
      expect(tokenOf(name), name).toBeDefined();
      expect(tokenOf(`${name}-foreground`), name).toBeDefined();
    }
    expect(
      checkSeparation(
        STACKRA_THEME,
        banners.map((subject) => ({ subject, from: ["danger", "warning", "success"] })),
      ),
    ).toEqual([]);
    expect(Object.keys(STACKRA_THEME.palette).filter((name) => name.startsWith("chart-"))).toEqual([
      "chart-1",
      "chart-2",
      "chart-3",
      "chart-4",
      "chart-5",
    ]);
  });

  // @covers sta-425:FR-001 sta-425:P-001
  it("gives the accent the brand's neutral steel, with paper or ink on it at 4.5:1 or more (ADR 0463)", () => {
    for (const name of STEEL_ACCENT) {
      const token = tokenOf(name);
      for (const mode of ["light", "dark"] as const) {
        const [, chroma, hue] =
          token?.[mode].match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/)?.slice(1) ?? [];
        expect(Number(hue), `${name} ${mode}`).toBe(252);
        expect(Number(chroma), `${name} ${mode}`).toBeGreaterThan(0);
        expect(Number(chroma), `${name} ${mode}`).toBeLessThanOrEqual(0.03);
      }
    }
    // The brand's own hex values (figentra/brand brands/stackra/tokens/theme.json, rules §31), so the derived hex and
    // the brand kit cannot drift apart.
    expect(
      Object.fromEntries(
        [...STEEL_ACCENT].map((name) => [name, [tokenOf(name)?.hexLight, tokenOf(name)?.hexDark]]),
      ),
    ).toEqual({
      accent: ["#647282", "#A7B6C7"],
      "accent-hover": ["#576574", "#97A6B7"],
      "accent-pressed": ["#495766", "#8897A8"],
      "accent-soft": ["#E6ECF3", "#262C33"],
      "accent-soft-foreground": ["#3C4958", "#CED9E5"],
      focus: ["#647282", "#A7B6C7"],
    });
    const { accent, "accent-foreground": on, background } = STACKRA_THEME.colors;
    expect(contrastRatio(on.hexLight, accent.hexLight)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(on.hexDark, accent.hexDark)).toBeGreaterThanOrEqual(4.5);
    // The ratios the brand records (rules §31): paper on the accent 4.53:1, ink on the dark accent 9.42:1.
    expect(contrastRatio(on.hexLight, accent.hexLight)).toBeCloseTo(4.53, 1);
    expect(contrastRatio(on.hexDark, accent.hexDark)).toBeCloseTo(9.42, 1);
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

  // ADR 0320 decision 4 (owner, 2026-10-25): muted text holds the same 4.5:1, on the thick level only. Each mode's
  // thick floor makes that level solid where its own fill cannot (liquid); on regular, muted text would fail in glass
  // and liquid, so it never sits there.
  it("keeps muted text at 4.5:1 on the thick material over black and white, in every mode", () => {
    const failures: string[] = [];
    for (const mode of ["light", "dark"] as const) {
      const surface = oklchToHex(STACKRA_THEME.colors.surface[mode]);
      const muted = oklchToHex(STACKRA_THEME.colors.muted[mode]);
      const share = STACKRA_THEME.materials.levels.thick.fill[mode];
      for (const [name, factors] of Object.entries(MATERIAL_MODES)) {
        const floor = Math.max(factors.fillFloor, factors.thickFloor);
        const fill = Math.min(1, Math.max(floor, share * factors.fillScale));
        const sheen = factors.sheen * STACKRA_THEME.materials.highlight[mode];
        for (const backdrop of ["#000000", "#ffffff"]) {
          const ratio = contrastRatio(muted, over("#ffffff", sheen, over(surface, fill, backdrop)));
          if (ratio < 4.5) failures.push(`${mode} ${name} over ${backdrop}: ${ratio.toFixed(2)}`);
        }
      }
    }
    expect(failures).toEqual([]);
    // The thick floor is a fallback, not a look: it is solid only where the mode's own thick fill would fail.
    expect(
      Object.entries(MATERIAL_MODES)
        .filter(([, f]) => f.thickFloor === 1)
        .map(([name]) => name),
    ).toEqual(["solid", "liquid"]);
  });
});
