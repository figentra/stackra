/**
 * Stackra file contract:
 * Purpose: proves the theme exports and the import round-trip: a full export and a changes-only export each read
 *          back to the theme they came from, a bare theme reads too, and text that is too long, not JSON, of an
 *          unknown format or not a usable theme is refused with InvalidThemeError, and a brand's §33 font keys
 *          (display, displayArabic, sansArabic) land on the theme's stacks. Also proves the DTCG export's
 *          shape: colours by mode, font lists, dimensions without `var()` and the material levels.
 * Boundary: in-memory themes only.
 * Runtime: node
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0022 (test placement).
 */
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { THEME_JSON_FORMATS } from "#core/constants/theme-json-formats.constant";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";
import { deriveTheme } from "#core/functions/derive-theme.function";
import { exportThemeDiff } from "#core/functions/export-theme-diff.function";
import { exportThemeJson } from "#core/functions/export-theme-json.function";
import { parseThemeJson } from "#core/functions/parse-theme-json.function";
import { themeToDtcg } from "#core/functions/theme-to-dtcg.function";

const ACME = deriveTheme(STACKRA_THEME, { name: "acme", accent: { hue: 30, chroma: 0.14 } });

const problemsOf = (text: string) => {
  try {
    parseThemeJson(text, STACKRA_THEME);
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidThemeError);
    return (error as InvalidThemeError).problems;
  }
  return [];
};

describe("theme JSON", () => {
  it("reads a full export back to its theme", () => {
    const file = exportThemeJson(ACME);
    expect(file.format).toBe(THEME_JSON_FORMATS.theme);
    expect(file.variables.heroui.light["--accent"]).toBe(ACME.colors.accent.light);
    expect(parseThemeJson(JSON.stringify(file), STACKRA_THEME)).toEqual(ACME);
  });

  it("reads a changes-only export back onto its base", () => {
    const file = exportThemeDiff(STACKRA_THEME, ACME);
    expect(file).toMatchObject({ format: THEME_JSON_FORMATS.diff, base: "stackra", name: "acme" });
    expect(Object.keys(file.changes)).toEqual(["name", "colors", "palette"]);
    expect(parseThemeJson(JSON.stringify(file), STACKRA_THEME)).toEqual(ACME);
  });

  // @covers sta-1386
  it("reads a brand's §33 font keys, sansArabic as the arabic stack, and keeps the base for a key left out", () => {
    const file = {
      format: THEME_JSON_FORMATS.diff,
      tokenSet: 1,
      base: "stackra",
      name: "velora",
      changes: {
        name: "velora",
        fontFamily: {
          display: '"Cormorant Garamond", serif',
          displayArabic: '"Markazi Text", serif',
          sansArabic: '"Markazi Text", "IBM Plex Sans Arabic", sans-serif',
        },
      },
    };
    expect(parseThemeJson(JSON.stringify(file), STACKRA_THEME).fontFamily).toEqual({
      sans: STACKRA_THEME.fontFamily.sans,
      mono: STACKRA_THEME.fontFamily.mono,
      arabic: '"Markazi Text", "IBM Plex Sans Arabic", sans-serif',
      display: '"Cormorant Garamond", serif',
      displayArabic: '"Markazi Text", serif',
    });
    const bare = { ...file, changes: { name: "velora" } };
    expect(parseThemeJson(JSON.stringify(bare), STACKRA_THEME).fontFamily).toEqual(
      STACKRA_THEME.fontFamily,
    );
  });

  it("reads a bare theme", () => {
    expect(parseThemeJson(JSON.stringify(ACME), STACKRA_THEME)).toEqual(ACME);
  });

  it("refuses text that is too long, not JSON, of an unknown format or not a theme", () => {
    expect(problemsOf(" ".repeat(600_000))).toEqual(["the file is over 512000 characters"]);
    expect(problemsOf("{not json")).toEqual(["the file is not JSON"]);
    expect(problemsOf("[1]")).toEqual(["the file is not a JSON object"]);
    expect(problemsOf('{"format":"figma/9"}')).toEqual(['"figma/9" is not a theme format']);
    expect(problemsOf('{"format":"stackra.theme-diff/1","changes":3}')).toEqual([
      "changes is not an object",
    ]);
    expect(problemsOf('{"name":"x"}').length).toBeGreaterThan(0);
  });
});

describe("themeToDtcg", () => {
  const tokens = themeToDtcg(ACME) as Record<string, Record<string, unknown>>;

  it("writes the colours by mode and the font stacks as lists", () => {
    const light = (tokens["color"]?.["light"] ?? {}) as Record<string, unknown>;
    expect(light["accent"]).toEqual({
      $type: "color",
      $value: {
        colorSpace: "oklch",
        components: [0.546, 0.14, 30],
        hex: ACME.colors.accent.hexLight.slice(0, 7),
      },
    });
    expect(tokens["font"]?.["sans"]).toEqual({
      $type: "fontFamily",
      $value: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
    });
  });

  it("leaves out a length that refers to another property and keeps the material levels", () => {
    expect(tokens["radius"]?.["field"]).toBeUndefined();
    expect(tokens["radius"]?.["base"]).toEqual({
      $type: "dimension",
      $value: { value: 0.25, unit: "rem" },
    });
    expect(tokens["material"]?.["thin"]).toMatchObject({
      blur: { $type: "dimension", $value: { value: 12, unit: "px" } },
    });
  });
});
