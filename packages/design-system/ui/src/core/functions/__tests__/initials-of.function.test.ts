/**
 * Stackra file contract:
 * Purpose: proves `initialsOf` for Latin, accented, hyphenated, multi-word, single-word, Arabic, Turkish-locale,
 *          surrogate-pair, empty and blank names.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0304; ADR 0022 (test placement).
 */
// @covers sta-350:FR-044
import { initialsOf } from "#core/functions/initials-of.function";

describe("initialsOf", () => {
  it.each([
    ["Ada Lovelace", "AL"],
    ["  ada   lovelace  ", "AL"],
    ["Mary Ann Smith", "MS"],
    ["Plato", "P"],
    ["Jean-Luc Picard", "JP"],
    ["émile zola", "ÉZ"],
  ])("gives the first letters of the first and last word of %j", (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });

  it("upper-cases in the given locale", () => {
    expect(initialsOf("ilhan kaya", "tr")).toBe("İK");
  });

  it("gives one letter for an Arabic-script name, whose letters would join", () => {
    expect(initialsOf("ليلى أحمد")).toBe("ل");
  });

  it("keeps a surrogate pair whole", () => {
    expect(initialsOf("\u{1D49C}da Lovelace")).toBe("\u{1D49C}L");
  });

  it("gives an empty string for an empty or blank name", () => {
    expect(initialsOf("")).toBe("");
    expect(initialsOf("   ")).toBe("");
  });
});
