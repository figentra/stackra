/**
 * Stackra file contract:
 * Purpose: proves `applyNativeTheme` pushes a document's variables to both Uniwind themes as the runtime takes them
 *          (lengths as px numbers, nothing it cannot read) and returns the theme's numbers.
 * Boundary: Uniwind mocked; the real @stackra/tokens.
 * Runtime: node (vitest)
 * Governing contract: ADR 0501 (section 5); ADR 0022 (test placement).
 */
import { createThemeDocument, deriveTheme, STACKRA_THEME } from "@stackra/tokens";

import { applyNativeTheme } from "#native/theme-document/apply-native-theme.function";

const pushed = vi.hoisted(() => new Map<string, Record<string, unknown>>());

vi.mock("uniwind", () => ({
  Uniwind: {
    updateCSSVariables: (mode: string, variables: Record<string, unknown>) =>
      pushed.set(mode, variables),
  },
}));

describe("applyNativeTheme", () => {
  it("pushes the document's variables to both schemes and returns its numbers", () => {
    const document = createThemeDocument(
      STACKRA_THEME,
      deriveTheme(STACKRA_THEME, { spacing: 3.6, radius: 8 }),
      { id: "compact", label: "Compact" },
    );
    const { tokens } = applyNativeTheme(document);
    for (const mode of ["light", "dark"]) {
      const variables = pushed.get(mode) ?? {};
      expect(variables["--spacing"]).toBeCloseTo(3.6);
      expect(variables["--radius"]).toBe(8);
      expect(variables["--accent"]).toBe(STACKRA_THEME.colors.accent[mode as "light" | "dark"]);
      expect(variables["--surface-shadow"]).toBeUndefined();
    }
    expect(tokens.controlHeight["md"]).toBeCloseTo(32.4);
  });
});
