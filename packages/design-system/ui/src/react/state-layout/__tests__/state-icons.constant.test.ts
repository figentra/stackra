/**
 * Stackra file contract:
 * Purpose: proves the web state registry draws every icon `STATE_ICON` names, so no EmptyState or ErrorState shows an
 *          empty icon well, and holds nothing more than those.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0313 (decision 6); ADR 0022 (test placement).
 */
// @covers sta-350:FR-149
import { STATE_ICON } from "#core/constants/state-icon.constant";
import { STATE_ICONS } from "#react/state-layout/state-icons.constant";

describe("STATE_ICONS (web)", () => {
  it("draws every icon the states name, and only those", () => {
    const names = [...new Set(Object.values(STATE_ICON))].sort();
    expect(Object.keys(STATE_ICONS).sort()).toEqual(names);
    for (const name of names) expect(STATE_ICONS[name], name).toBeDefined();
  });
});
