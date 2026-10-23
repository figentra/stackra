/**
 * Stackra file contract:
 * Purpose: proves every Stackra icon alias has a drawing, that the drawing is a Lucide icon, and that no alias is
 *          itself a Lucide name, so a name means one thing.
 * Boundary: pure data checks.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0022 (test placement).
 */
// @covers sta-350:FR-049
import { IconAlias } from "#contracts/enums/icon-alias.enum";
import { LucideIconName } from "#contracts/enums/lucide-icon-name.enum";
import { ICON_ALIAS_TARGETS } from "#core/constants/icon-alias-targets.constant";

describe("ICON_ALIAS_TARGETS", () => {
  it("has a target for every alias and nothing else", () => {
    expect(Object.keys(ICON_ALIAS_TARGETS).sort()).toEqual([...IconAlias].sort());
  });

  it.each(IconAlias)("draws %s with a Lucide icon", (alias) => {
    expect(LucideIconName).toContain(ICON_ALIAS_TARGETS[alias]);
  });

  it.each(IconAlias)("keeps %s apart from the Lucide names", (alias) => {
    expect(LucideIconName).not.toContain(alias);
  });
});
