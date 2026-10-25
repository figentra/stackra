/**
 * Stackra file contract:
 * Purpose: proves the native renderer writes the Uniwind theme HeroUI Native reads: the radii in `@theme`, and the
 *          same role, shadow and palette variables in the light and dark variants of `@layer theme { :root { … } }`,
 *          and that the committed assets/public/themes/stackra/native.css equals its output byte for byte. The
 *          palette lands as Uniwind colours, so the accent steps native paints hold their label at 4.5:1 (STA-455).
 *          It also proves the type scale is written in absolute px on HeroUI Native's text classes, with the Arabic
 *          twins as `type-<token>-ar`.
 * Boundary: renders in memory; `vitest run -u` rewrites the committed stylesheet.
 * Runtime: node
 * Governing contract: ADR 0302; ADR 0165 (HeroUI Native and Uniwind on native); ADR 0022 (test placement).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import type { Theme, TypographyToken } from "#contracts/types/theme.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { contrastRatio } from "#core/functions/contrast-ratio.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";
import { renderNativeCss } from "#core/functions/render-native-css.function";

const css = renderNativeCss(STACKRA_THEME);
const { body: BODY, h1: H1 } = STACKRA_THEME.typography as Record<"body" | "h1", TypographyToken>;
const variantOf = (mode: "light" | "dark") =>
  css.split(`    @variant ${mode} {\n`)[1]?.split("\n    }")[0] ?? "";
const names = (block: string) => [...block.matchAll(/--([\w-]+):/g)].map((match) => match[1]);
/** The value a variant gives one variable, as written. */
const valueIn = (block: string, name: string) =>
  block.match(new RegExp(`^ {6}--${name}: (.+);$`, "m"))?.[1] ?? "";
const PALETTE = Object.keys(STACKRA_THEME.palette);

// @covers sta-350:FR-004 sta-350:FR-020
describe("renderNativeCss", () => {
  it("matches the committed stylesheet byte for byte", async () => {
    await expect(css).toMatchFileSnapshot("../../../../assets/public/themes/stackra/native.css");
  });

  it("nests both variants in :root inside @layer theme", () => {
    expect(css).toMatch(/\n@layer theme \{\n {2}:root \{\n {4}@variant light \{\n/);
    expect(css).toMatch(/\n\n {4}@variant dark \{\n[\s\S]*\n {4}\}\n {2}\}\n\}\n\n/);
  });

  it("defines every colour role, shadow and palette colour in both variants, and the same set in each", () => {
    for (const mode of ["light", "dark"] as const) {
      const block = variantOf(mode);
      for (const role of ColorRole)
        expect(block, role).toContain(`      --${role}: ${STACKRA_THEME.colors[role][mode]};`);
      for (const shadow of ["surface", "overlay", "field"] as const)
        expect(block).toContain(`--${shadow}-shadow: ${STACKRA_THEME.shadows[shadow][mode]};`);
    }
    expect(names(variantOf("dark"))).toEqual(names(variantOf("light")));
    expect(names(variantOf("light"))).toHaveLength(ColorRole.length + 3 + PALETTE.length);
  });

  // @covers sta-455:FR-001
  it("writes the palette as Uniwind colours, so HeroUI Native's soft and hover steps take the theme's value", () => {
    for (const mode of ["light", "dark"] as const) {
      const block = variantOf(mode);
      for (const name of PALETTE)
        expect(valueIn(block, `color-${name}`), name).toBe(STACKRA_THEME.palette[name]?.[mode]);
    }
    // HeroUI Native's theme mixes these from the accent; the theme's own steps replace them.
    expect(valueIn(variantOf("light"), "color-accent-soft")).toBe("oklch(0.925 0.006 248)");
    expect(valueIn(variantOf("dark"), "color-accent-pressed")).toBe("oklch(0.8 0.008 248)");
  });

  // @covers sta-455:FR-002
  it("keeps the accent label at 4.5:1 on every accent step native paints, and the soft pair, in both schemes", () => {
    const failures: string[] = [];
    for (const mode of ["light", "dark"] as const) {
      const block = variantOf(mode);
      const ratio = (fg: string, bg: string) =>
        contrastRatio(oklchToHex(valueIn(block, fg)), oklchToHex(valueIn(block, bg)));
      const pairs = [
        ["accent-foreground", "accent"],
        ["accent-foreground", "color-accent-hover"],
        ["accent-foreground", "color-accent-pressed"],
        ["color-accent-soft-foreground", "color-accent-soft"],
      ] as const;
      for (const [fg, bg] of pairs)
        if (ratio(fg, bg) < 4.5)
          failures.push(`${mode} ${fg} on ${bg}: ${ratio(fg, bg).toFixed(2)}`);
    }
    expect(failures).toEqual([]);
  });

  it("sets the base and field radius in @theme and leaves web-only tokens out", () => {
    expect(css).toContain("@theme {\n  --radius: 0.25rem;\n  --field-radius: var(--radius);\n}");
    expect(css).not.toMatch(/--font-|--space-|--duration-|--material-/);
  });

  it("restyles HeroUI Native's text classes in absolute px", () => {
    expect(css).toContain(
      ".text__root--type-h1 {\n  font-size: 40px;\n  line-height: 44px;\n  letter-spacing: -1.2px;\n}",
    );
    expect(css).toContain(
      ".text__root--type-body-sm {\n  font-size: 14px;\n  line-height: 21px;\n  letter-spacing: 0px;\n}",
    );
    expect(css).toContain(".text__root--type-h6 {\n  font-size: 14px;");
  });

  it("writes the Arabic twins as classes named after the token, and no font weight", () => {
    expect(css).toContain(
      ".type-h1-ar {\n  font-size: 38px;\n  line-height: 51.3px;\n  letter-spacing: 0px;\n}",
    );
    expect(css).toContain(".type-small-ar {\n  font-size: 15px;");
    expect(css).not.toContain("font-weight");
  });

  it("takes a px line height as it is and an em or px letter spacing in px", () => {
    const typography = {
      ...STACKRA_THEME.typography,
      body: { ...BODY, lineHeight: "24px", letterSpacing: "0.5px" },
      h1: { ...H1, letterSpacing: "0.1em" },
    };
    const own = renderNativeCss({ ...STACKRA_THEME, typography } as Theme);
    expect(own).toContain(
      ".text__root--type-body {\n  font-size: 16px;\n  line-height: 24px;\n  letter-spacing: 0.5px;\n}",
    );
    expect(own).toContain("  letter-spacing: 4px;");
  });

  it("writes no rule for a type the theme does not define", () => {
    const { h6, "h6-ar": _arabic, ...typography } = STACKRA_THEME.typography;
    const own = renderNativeCss({ ...STACKRA_THEME, typography } as Theme);
    expect(h6).toBeDefined();
    expect(own).not.toContain("type-h6");
    expect(own).toContain(".text__root--type-h5 {");
  });
});
