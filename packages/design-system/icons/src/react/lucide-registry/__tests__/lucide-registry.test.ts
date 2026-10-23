/**
 * Stackra file contract:
 * Purpose: proves the generated web registry holds a real lucide-react component for every `LucideIconName`, nothing
 *          more, and that each name's component is the one Lucide exports under the name's PascalCase form.
 * Boundary: imports the real `lucide-react` in node; no rendering.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 10); ADR 0183 (budgets: the full map is opt-in); ADR 0022.
 */
// @covers sta-350:FR-048 sta-350:FR-051
import * as lucide from "lucide-react";

import { LucideIconName } from "#contracts/enums/lucide-icon-name.enum";
import { LUCIDE_REACT_ICONS } from "#react/lucide-registry/lucide-registry";

describe("LUCIDE_REACT_ICONS", () => {
  it("has exactly the Lucide names", () => {
    expect(Object.keys(LUCIDE_REACT_ICONS).sort()).toEqual([...LucideIconName]);
  });

  it("holds a lucide-react component for every name", () => {
    const icons = lucide.icons as Record<string, unknown>;
    const lucideComponents = new Set(Object.values(icons));
    for (const name of LucideIconName)
      expect(lucideComponents.has(LUCIDE_REACT_ICONS[name])).toBe(true);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(LUCIDE_REACT_ICONS)).toBe(true);
  });
});
