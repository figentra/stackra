/**
 * Stackra file contract:
 * Purpose: proves `isIconName` accepts every Lucide name, every alias and a well-formed custom name, and rejects other
 *          strings, PascalCase component names, malformed custom names and values that are not strings.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0022 (test placement).
 */
// @covers sta-350:FR-049
import { IconAlias } from "#contracts/enums/icon-alias.enum";
import { LucideIconName } from "#contracts/enums/lucide-icon-name.enum";
import { isIconName } from "#core/functions/is-icon-name.function";

describe("isIconName", () => {
  it("accepts every Lucide name and every alias", () => {
    expect(LucideIconName.every((name) => isIconName(name))).toBe(true);
    expect(IconAlias.every((name) => isIconName(name))).toBe(true);
  });

  it.each(["loyalty::points-badge", "crm::brands/acme", "pos_terminal::card.reader"])(
    "accepts the custom name %s",
    (name) => {
      expect(isIconName(name)).toBe(true);
    },
  );

  it.each([
    "ArrowRight",
    "arrow_right",
    "not-an-icon",
    "",
    "::",
    "loyalty::",
    "::points-badge",
    "Loyalty::points-badge",
    "loyalty:points-badge",
    "constructor",
  ])("rejects %j", (value) => {
    expect(isIconName(value)).toBe(false);
  });

  it.each([undefined, null, 3, {}, ["arrow-right"]])("rejects the non-string %j", (value) => {
    expect(isIconName(value)).toBe(false);
  });
});
