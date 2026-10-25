/**
 * Stackra file contract:
 * Purpose: proves themeNameOf turns any layer id into a kebab-case theme name: a tenant's public id, spaces and
 *          punctuation, an id that begins with a digit, and one that leaves nothing.
 * Boundary: pure strings.
 * Runtime: node
 * Governing contract: ADR 0340 (decision 2); ADR 0022 (test placement).
 */
import { themeNameOf } from "#core/functions/theme-name-of.function";

describe("themeNameOf", () => {
  it.each([
    ["ten_01HZX9", "ten-01hzx9"],
    ["Acme Retail, EU", "acme-retail-eu"],
    ["42-shops", "layer-42-shops"],
    ["___", "layer"],
    ["juristra", "juristra"],
  ])("names %s as %s", (id, name) => {
    expect(themeNameOf(id)).toBe(name);
  });
});
