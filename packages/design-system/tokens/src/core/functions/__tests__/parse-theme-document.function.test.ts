/**
 * Stackra file contract:
 * Purpose: proves a theme is data (ADR 0501 section 7): `createThemeDocument` stores only the changes, and
 *          `parseThemeDocument` rebuilds the same theme from it and refuses a bad frame or a bad change; a DTCG tree
 *          from `themeToDtcg` comes back through `dtcgToThemeDiff` as a usable diff.
 * Boundary: pure calls on in-memory themes.
 * Runtime: node
 * Governing contract: ADR 0501; ADR 0022 (test placement).
 */
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";
import { createThemeDocument } from "#core/functions/create-theme-document.function";
import { deriveTheme } from "#core/functions/derive-theme.function";
import { dtcgToThemeDiff } from "#core/functions/dtcg-to-theme-diff.function";
import { mergeTheme } from "#core/functions/merge-theme.function";
import { parseThemeDocument } from "#core/functions/parse-theme-document.function";
import { themeToDtcg } from "#core/functions/theme-to-dtcg.function";

describe("theme documents", () => {
  const built = deriveTheme(STACKRA_THEME, { name: "compact", spacing: 3.6, pillControls: true });
  const document = createThemeDocument(STACKRA_THEME, built, { id: "compact", label: "Compact" });

  it("stores the changes only, as a draft", () => {
    expect(document).toMatchObject({
      format: "stackra.theme-document/1",
      id: "compact",
      base: "stackra",
      status: "draft",
      changes: {
        layout: { spacing: "0.225rem" },
        radius: { steps: { control: "var(--radius-pill)" } },
      },
    });
    expect(document.changes.colors).toBeUndefined();
  });

  it("rebuilds the theme it was made from", () => {
    const { theme } = parseThemeDocument(structuredClone(document), STACKRA_THEME);
    expect(theme.layout.spacing).toBe("0.225rem");
    expect(theme.radius.steps["control"]).toBe("var(--radius-pill)");
    expect(theme.name).toBe("compact");
  });

  it("refuses a bad frame and a bad change", () => {
    expect(() =>
      parseThemeDocument({ ...document, id: "Bad Id", status: "live" }, STACKRA_THEME),
    ).toThrow(InvalidThemeError);
    expect(() =>
      parseThemeDocument(
        { ...document, changes: { layout: { spacing: "url(x)" } } },
        STACKRA_THEME,
      ),
    ).toThrow(InvalidThemeError);
    expect(() => parseThemeDocument({ ...document, base: "other" }, STACKRA_THEME)).toThrow(
      InvalidThemeError,
    );
  });

  it("brings a DTCG tree back as a diff the base accepts", () => {
    const diff = dtcgToThemeDiff(themeToDtcg(built));
    const theme = mergeTheme(STACKRA_THEME, diff);
    expect(theme.layout.controlHeight["md"]).toBe("32.4px");
    expect(theme.colors.accent.light).toBe(STACKRA_THEME.colors.accent.light);
    expect(theme.motion["indicator"]?.easing).toBe("cubic-bezier(0.32, 0.72, 0, 1)");
  });
});
