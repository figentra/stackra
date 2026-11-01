/**
 * Stackra file contract:
 * Purpose: proves `shapeArabic` picks the joined form of each letter and the lam-alef ligature, and `visualBidi`
 *          reverses right-to-left runs (keeping digit groups and left-to-right text in place) for terminals without
 *          bidi or shaping.
 * Boundary: unit test.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-026; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-026
import { shapeArabic } from "#core/functions/shape-arabic.function";
import { visualBidi } from "#core/functions/visual-bidi.function";

/** Text from presentation-form code points. */
const forms = (...codes: number[]) => String.fromCodePoint(...codes);

describe("shapeArabic", () => {
  it("joins each letter to its neighbours", () => {
    // ش initial, ر final (it does not join onward), ك initial, ة final.
    expect(shapeArabic("شركة")).toBe(forms(0xfe_b7, 0xfe_ae, 0xfe_db, 0xfe_94));
  });

  it("writes lam-alef as its ligature", () => {
    // ا isolated, لأ isolated ligature, م initial, ل final.
    expect(shapeArabic("الأمل")).toBe(forms(0xfe_8d, 0xfe_f7, 0xfe_e3, 0xfe_de));
  });

  it("looks through harakat and leaves other text alone", () => {
    expect(shapeArabic("بَب")).toBe(`${forms(0xfe_91)}َ${forms(0xfe_90)}`);
    expect(shapeArabic("abc 12")).toBe("abc 12");
  });
});

describe("visualBidi", () => {
  it("reverses a right-to-left run inside a left-to-right line", () => {
    expect(visualBidi("Account: شركة الأمل")).toBe(
      `Account: ${forms(0xfe_de, 0xfe_e3, 0xfe_f7, 0xfe_8d)} ${forms(0xfe_94, 0xfe_db, 0xfe_ae, 0xfe_b7)}`,
    );
  });

  it("keeps digit groups left to right inside a run", () => {
    const shown = visualBidi("شارع 15 الملك");
    expect(shown).toContain(" 15 ");
    expect(shown.indexOf("15")).toBeGreaterThan(0);
  });

  it("leaves text without a right-to-left letter unchanged", () => {
    expect(visualBidi("Tokyo 日本 42")).toBe("Tokyo 日本 42");
  });
});
