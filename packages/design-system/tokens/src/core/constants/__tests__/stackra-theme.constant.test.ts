/**
 * Stackra file contract:
 * Purpose: proves the stackra theme carries the approved brand kit unchanged: its colours equal the kit's resolved
 *          tokens, every pairing the kit's contrast report holds to a WCAG minimum still meets it, the accent family
 *          stays achromatic, and the fonts moved with the theme beside their OFL licences.
 * Boundary: reads the kit reports and fonts in assets/; computes contrast from the oklch values.
 * Runtime: node
 * Governing contract: ADR 0302; ADR 0024 (fonts keep the SIL OFL); ADR 0022 (test placement).
 */
import { existsSync, readFileSync } from "node:fs";

import type { ColorToken } from "#contracts/types/theme.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";

const assets = new URL("../../../../assets/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, assets), "utf8");
const kit = <T>(name: string) => JSON.parse(read(`data/stackra/${name}.json`)) as T;
type Mode = "light" | "dark";

const tokenOf = (name: string): ColorToken | undefined =>
  (STACKRA_THEME.colors as Readonly<Record<string, ColorToken>>)[name] ??
  STACKRA_THEME.palette[name];

const clip = (channel: number) => Math.min(1, Math.max(0, channel));

/** WCAG 2 relative luminance of an `oklch(L C H)` colour, through OKLab and linear sRGB (clipped to the gamut). */
const luminance = (oklch: string): number => {
  const [lightness, chroma, hue] = (oklch.match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)/) ?? [])
    .slice(1)
    .map(Number) as [number, number, number];
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const red = clip(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = clip(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = clip(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrast = (one: string, two: string) => {
  const [high, low] = [luminance(one), luminance(two)].sort((x, y) => y - x) as [number, number];
  return (high + 0.05) / (low + 0.05);
};

// The kit labels the modes "base" and "dark".
const modeOf = (theme: string): Mode => (theme === "dark" ? "dark" : "light");

// @covers sta-350:FR-002
describe("STACKRA_THEME", () => {
  it("is named stackra", () => {
    expect(STACKRA_THEME.name).toBe("stackra");
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
    for (const token of resolved)
      expect(tokenOf(token.name), token.name).toEqual({
        light: token.light.value,
        dark: token.dark.value,
        hexLight: token.light.hex,
        hexDark: token.dark.hex,
      });
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
      expect(Math.abs(ratio - row.ratio), pair).toBeLessThan(0.1);
    }
  });

  it("keeps the accent family achromatic (oklch chroma below 0.02), as the kit's separation report records", () => {
    const rows = kit<{ neutrality: { theme: string; name: string; hex: string }[] }>(
      "separation",
    ).neutrality;
    expect(rows.length).toBeGreaterThan(10);
    for (const row of rows) {
      const mode = modeOf(row.theme);
      const token = tokenOf(row.name);
      const chroma = Number(token?.[mode].match(/oklch\([\d.]+ ([\d.]+)/)?.[1]);
      expect(chroma, row.name).toBeLessThan(0.02);
      expect(mode === "dark" ? token?.hexDark : token?.hexLight, row.name).toBe(row.hex);
    }
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
});
